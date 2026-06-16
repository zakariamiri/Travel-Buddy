import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TripInvitationRow = {
  id: string;
  invited_email: string;
  invite_code: string;
  created_at: string;
  accepted_at?: string | null;
  trips:
    | {
        id: string;
        name: string;
        destination: string | null;
      }
    | {
        id: string;
        name: string;
        destination: string | null;
      }[]
    | null;
};

type TripNotificationRow = {
  id: string;
  title: string;
  message: string;
  type: "activity_created";
  created_at: string;
  trip_id: string;
  activity_id: string | null;
  trips:
    | {
        id: string;
        name: string;
        destination: string | null;
      }
    | {
        id: string;
        name: string;
        destination: string | null;
      }[]
    | null;
};

function mapInvitation(invitation: TripInvitationRow) {
  const trip = Array.isArray(invitation.trips)
    ? invitation.trips[0]
    : invitation.trips;

  return {
    id: invitation.id,
    invitedEmail: invitation.invited_email,
    inviteCode: invitation.invite_code,
    createdAt: invitation.created_at,
    acceptedAt: invitation.accepted_at || null,
    trip: trip
      ? {
          id: trip.id,
          name: trip.name,
          destination: trip.destination,
        }
      : null,
  };
}

function isMissingInvitationsTable(message?: string) {
  return message?.includes("trip_invitations") && message.includes("schema cache");
}

function isMissingNotificationsTable(message?: string) {
  return message?.includes("trip_notifications") && message.includes("schema cache");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        invitations: [],
        acceptedInvitations: [],
        activityNotifications: [],
        error: "Configuration Supabase manquante",
      },
      { status: 200 },
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user?.email) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("trip_invitations")
    .select("id, invited_email, invite_code, created_at, trips(id, name, destination)")
    .eq("status", "pending")
    .ilike("invited_email", user.email)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingInvitationsTable(error.message)) {
      return NextResponse.json({ invitations: [], acceptedInvitations: [] });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: ownerMemberships, error: ownerMembershipsError } =
    await supabase
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", user.id)
      .eq("role", "owner");

  if (ownerMembershipsError) {
    return NextResponse.json(
      { error: ownerMembershipsError.message },
      { status: 500 },
    );
  }

  const ownedTripIds = (ownerMemberships || []).map((row) => row.trip_id);

  const {
    data: acceptedData,
    error: acceptedError,
  } = ownedTripIds.length
    ? await supabase
        .from("trip_invitations")
        .select("id, invited_email, invite_code, created_at, accepted_at, trips(id, name, destination)")
        .eq("status", "accepted")
        .in("trip_id", ownedTripIds)
        .order("accepted_at", { ascending: false })
        .limit(10)
    : { data: [], error: null };

  if (acceptedError) {
    return NextResponse.json({ error: acceptedError.message }, { status: 500 });
  }

  const {
    data: notificationData,
    error: notificationError,
  } = await supabase
    .from("trip_notifications")
    .select("id, title, message, type, created_at, trip_id, activity_id, trips(id, name, destination)")
    .eq("recipient_id", user.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (notificationError) {
    if (!isMissingNotificationsTable(notificationError.message)) {
      return NextResponse.json(
        { error: notificationError.message },
        { status: 500 },
      );
    }
  }

  const activityNotifications = ((notificationData || []) as TripNotificationRow[]).map(
    (notification) => {
      const trip = Array.isArray(notification.trips)
        ? notification.trips[0]
        : notification.trips;

      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.created_at,
        activityId: notification.activity_id,
        trip: trip
          ? {
              id: trip.id,
              name: trip.name,
              destination: trip.destination,
            }
          : {
              id: notification.trip_id,
              name: "Trip",
              destination: null,
            },
      };
    },
  );

  return NextResponse.json({
    invitations: ((data || []) as TripInvitationRow[]).map(mapInvitation),
    acceptedInvitations: ((acceptedData || []) as TripInvitationRow[]).map(
      mapInvitation,
    ),
    activityNotifications,
  });
}
