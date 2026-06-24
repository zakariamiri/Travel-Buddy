import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 401 });
  }

  const { tripId } = await request.json().catch(() => ({ tripId: null }));
  if (!tripId) {
    return NextResponse.json({ error: "tripId est requis" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Configuration Supabase manquante" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const { data: joinedMember, error: joinedMemberError } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (joinedMemberError) {
    return NextResponse.json({ error: joinedMemberError.message }, { status: 500 });
  }

  if (!joinedMember) {
    return NextResponse.json({ error: "Vous n'etes pas membre de ce voyage" }, { status: 403 });
  }

  const { data: existingNotification, error: existingNotificationError } =
    await supabase
      .from("trip_notifications")
      .select("id")
      .eq("trip_id", tripId)
      .eq("actor_id", user.id)
      .eq("title", "Nouveau membre")
      .limit(1)
      .maybeSingle();

  if (existingNotificationError) {
    return NextResponse.json(
      { error: existingNotificationError.message },
      { status: 500 },
    );
  }

  if (existingNotification) {
    return NextResponse.json({ success: true, created: 0 });
  }

  const { data: members, error: membersError } = await supabase
    .from("trip_members")
    .select("user_id, role")
    .eq("trip_id", tripId)
    .neq("user_id", user.id);

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Un membre";

  const recipientIds = [
    ...new Set(
      (members || [])
        .sort((a, b) => {
          if (a.role === "owner" && b.role !== "owner") return -1;
          if (a.role !== "owner" && b.role === "owner") return 1;
          return 0;
        })
        .map((member) => member.user_id),
    ),
  ];

  const notifications = recipientIds.map((recipientId) => ({
    recipient_id: recipientId,
    actor_id: user.id,
    trip_id: tripId,
    type: "activity_created",
    title: "Nouveau membre",
    message: `${fullName} a rejoint le voyage via le lien d'invitation.`,
  }));

  if (notifications.length === 0) {
    return NextResponse.json({ success: true, created: 0 });
  }

  const { error: insertError } = await supabase
    .from("trip_notifications")
    .insert(notifications);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, created: notifications.length });
}
