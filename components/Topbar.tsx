import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MailCheck, Search, Vote } from "lucide-react";
import md5 from "md5";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type TopbarInvitation = {
  id: string;
  inviteCode: string;
  invitedEmail?: string;
  notificationType: "incoming" | "accepted";
  trip: {
    id?: string;
    name: string;
    destination?: string | null;
  } | null;
};

type TopbarActivityNotification = {
  id: string;
  title: string;
  message: string;
  activityId?: string | null;
  notificationType: "activity_created";
  trip: {
    id?: string;
    name: string;
    destination?: string | null;
  } | null;
};

type TopbarNotification = TopbarInvitation | TopbarActivityNotification;

function TopbarContent() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [notifications, setNotifications] = useState<TopbarNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const handleSearch = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      const fullName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0];

      setName(fullName || "User");

      const email = user?.email || "";
      const hash = md5(email.trim().toLowerCase());

      const avatarUrl =
        user?.user_metadata?.avatar_url ||
        `https://www.gravatar.com/avatar/${hash}?d=identicon`;

      setAvatar(avatarUrl);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) return;

      try {
        const res = await fetch("/api/invitations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        const incoming = Array.isArray(payload.invitations)
          ? payload.invitations.map((invitation: Omit<TopbarInvitation, "notificationType">) => ({
              ...invitation,
              notificationType: "incoming" as const,
            }))
          : [];
        const accepted = Array.isArray(payload.acceptedInvitations)
          ? payload.acceptedInvitations.map(
              (invitation: Omit<TopbarInvitation, "notificationType">) => ({
                ...invitation,
                notificationType: "accepted" as const,
              }),
            )
          : [];
        const activities = Array.isArray(payload.activityNotifications)
          ? payload.activityNotifications.map(
              (notification: Omit<TopbarActivityNotification, "notificationType">) => ({
                ...notification,
                notificationType: "activity_created" as const,
              }),
            )
          : [];

        setNotifications([...incoming, ...accepted, ...activities]);
      } catch (err) {
        console.error("Erreur chargement notifications:", err);
      }
    };

    getUser();
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#ead9bf] bg-white/90 px-4 shadow-sm backdrop-blur md:px-6">
      <div className="flex w-full items-center gap-4 md:max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9f411d]" />
          <Input
            placeholder="Search destinations..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 rounded-lg border-[#ead9bf] bg-[#fff8ec] pl-9 text-sm shadow-none focus-visible:ring-[#c9603a]/30"
          />
        </div>
      </div>

      <div className="ml-4 flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative flex size-10 cursor-pointer items-center justify-center rounded-lg border border-[#ead9bf] bg-white text-gray-600 transition hover:bg-sidebar hover:text-[#9f411d]"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {notifications.length > 0 && (
              <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {notifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-[#ead9bf] bg-white p-2 shadow-xl">
              <div className="px-2 py-2 text-sm font-bold text-gray-900">
                Notifications
              </div>

              {notifications.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground">
                  No invitations yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() =>
                        router.push(
                          notification.notificationType === "incoming"
                            ? `/join?code=${notification.inviteCode}`
                            : notification.trip?.id
                              ? notification.notificationType === "activity_created"
                                ? `/dashboard/${notification.trip.id}/votes`
                                : `/dashboard/${notification.trip.id}`
                              : "/dashboard",
                        )
                      }
                      className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-3 py-3 text-left transition hover:bg-[#fff8ec]"
                    >
                      {notification.notificationType === "activity_created" ? (
                        <Vote className="mt-0.5 size-4 shrink-0 text-[#9f411d]" />
                      ) : (
                        <MailCheck className="mt-0.5 size-4 shrink-0 text-[#9f411d]" />
                      )}
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">
                          {notification.notificationType === "incoming"
                            ? "You have a trip invitation"
                            : notification.notificationType === "accepted"
                              ? "Invitation accepted"
                              : "Nouvelle activite a voter"}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {notification.notificationType === "accepted"
                            ? `${notification.invitedEmail || "A member"} accepted`
                            : notification.trip?.name || "Trip notification"}
                          {notification.trip?.destination
                            ? ` - ${notification.trip.destination}`
                            : ""}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-[#9f411d]">
                          {notification.notificationType === "incoming"
                            ? "Check your email or click to join."
                            : notification.notificationType === "activity_created"
                              ? notification.message
                              : notification.trip?.name || "Open trip dashboard."}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-[#ead9bf] bg-white px-2.5 py-1.5 shadow-sm">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-800">{name}</p>
            <p className="text-xs text-muted-foreground">Traveler</p>
          </div>
          <Avatar className="size-9 ring-2 ring-[#f3e4da]">
            <AvatarImage src={avatar} />
            <AvatarFallback>{name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

export default function Topbar() {
  return (
    <Suspense fallback={null}>
      <TopbarContent />
    </Suspense>
  );
}
