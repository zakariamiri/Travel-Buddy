import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

function parseEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function createInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .single();

  if (membershipError || membership?.role !== "owner") {
    return NextResponse.json(
      { error: "Seul le owner peut inviter" },
      { status: 403 },
    );
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, name, invite_code")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
  }

  let inviteCode = trip.invite_code;

  if (!inviteCode) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = createInviteCode();
      const { data, error } = await supabase
        .from("trips")
        .update({ invite_code: code })
        .eq("id", tripId)
        .select("invite_code")
        .single();

      if (!error) {
        inviteCode = data.invite_code;
        break;
      }
      if (error.code !== "23505") {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  if (!inviteCode) {
    return NextResponse.json(
      { error: "Impossible de générer le lien" },
      { status: 500 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const inviteLink = `${siteUrl}/join?code=${inviteCode}`;

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
        subject: `Invitation voyage - ${trip.name}`,
        html: `
          <div style="background:#FFEEE0;padding:32px;font-family:Arial,sans-serif;">
            <div style="max-width:520px;margin:0 auto;background:white;border-radius:14px;padding:28px;box-shadow:0 8px 28px rgba(0,0,0,.08);">
              <h1 style="margin:0 0 12px;color:#1a1a1a;font-size:24px;">Rejoins notre voyage</h1>
              <p style="margin:0 0 22px;color:#555;line-height:1.5;">
                Tu as été invité(e) à collaborer sur le voyage <strong>${trip.name}</strong> dans Travel Buddy.
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

  return NextResponse.json({ success: true, sent: emailList.length });
}
