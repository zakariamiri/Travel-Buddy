import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { apiUrl } from "@/lib/api";

function parseEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isMissingInvitationsTable(message?: string) {
  return message?.includes("trip_invitations") && message.includes("schema cache");
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 401 });
  }

  const { tripId, emails } = await request.json();
  const emailList = parseEmails(emails || "");

  if (!tripId || emailList.length === 0) {
    return NextResponse.json(
      { error: "tripId et emails sont requis" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Configuration Supabase manquante" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const tripResponse = await fetch(apiUrl(`/api/trips/${tripId}`), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const tripPayload = await tripResponse.json().catch(() => ({}));

  if (!tripResponse.ok) {
    return NextResponse.json(
      { error: tripPayload.error || "Voyage introuvable" },
      { status: tripResponse.status },
    );
  }

  if (!["owner", "admin"].includes(tripPayload.role || "")) {
    return NextResponse.json(
      { error: "Seul l'admin du voyage peut inviter" },
      { status: 403 },
    );
  }

  const inviteCodeResponse = await fetch(apiUrl(`/api/trips/${tripId}/invite-code`), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const inviteCodePayload = await inviteCodeResponse.json().catch(() => ({}));
  const inviteCode = inviteCodePayload.invite_code || tripPayload.invite_code;

  if (!inviteCode) {
    return NextResponse.json(
      { error: inviteCodePayload.error || "Impossible de generer le lien" },
      { status: 500 },
    );
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: invitedUsers } = await supabase
      .from("users")
      .select("id, email")
      .in("email", emailList);

    const usersByEmail = new Map(
      (invitedUsers || []).map((invitedUser) => [
        invitedUser.email?.toLowerCase(),
        invitedUser.id,
      ]),
    );
    const invitedUserIds = [...new Set([...usersByEmail.values()].filter(Boolean))];

    const { data: existingMembers } =
      invitedUserIds.length
        ? await supabase
            .from("trip_members")
            .select("user_id")
            .eq("trip_id", tripId)
            .in("user_id", invitedUserIds)
        : { data: [] };

    const existingMemberIds = new Set(
      (existingMembers || []).map((member) => member.user_id),
    );
    const acceptedAt = new Date().toISOString();

    const { error: invitationError } = await supabase
      .from("trip_invitations")
      .upsert(
        emailList.map((email) => {
          const invitedUserId = usersByEmail.get(email);
          const isAlreadyMember = Boolean(
            invitedUserId && existingMemberIds.has(invitedUserId),
          );

          return {
            trip_id: tripId,
            invited_email: email,
            invite_code: inviteCode,
            invited_by: user.id,
            status: isAlreadyMember ? "accepted" : "pending",
            accepted_at: isAlreadyMember ? acceptedAt : null,
          };
        }),
        { onConflict: "trip_id,invited_email" },
      );

    if (invitationError && !isMissingInvitationsTable(invitationError.message)) {
      console.warn("Invitation tracking skipped:", invitationError.message);
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const inviteLink = `${siteUrl}/join?code=${inviteCode}`;

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({
      success: true,
      sent: 0,
      inviteLink,
      warning: "GMAIL_USER ou GMAIL_APP_PASSWORD manquant",
    });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await Promise.all(
    emailList.map((email) =>
      transporter.sendMail({
        from: `Travel Buddy <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `Invitation voyage - ${tripPayload.name}`,
        html: `
          <div style="background:#FFEEE0;padding:32px;font-family:Arial,sans-serif;">
            <div style="max-width:520px;margin:0 auto;background:white;border-radius:14px;padding:28px;box-shadow:0 8px 28px rgba(0,0,0,.08);">
              <h1 style="margin:0 0 12px;color:#1a1a1a;font-size:24px;">Rejoins notre voyage</h1>
              <p style="margin:0 0 22px;color:#555;line-height:1.5;">
                Tu as ete invite(e) a collaborer sur le voyage <strong>${tripPayload.name}</strong> dans Travel Buddy.
              </p>
              <a href="${inviteLink}" style="display:inline-block;background:#9f411d;color:#fff;text-decoration:none;border-radius:10px;padding:13px 22px;font-weight:700;">
                Rejoindre le voyage
              </a>
              <p style="margin:22px 0 0;color:#777;font-size:13px;">${inviteLink}</p>
            </div>
          </div>
        `,
      }),
    ),
  );

  return NextResponse.json({ success: true, sent: emailList.length, inviteLink });
}
