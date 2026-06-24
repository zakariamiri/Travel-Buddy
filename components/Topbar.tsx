import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MailCheck, Search, UserPlus, Vote } from "lucide-react";
import md5 from "md5";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";

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
  type: "activity_created" | "member_joined";
  activityId?: string | null;
  notificationType: "activity_created" | "member_joined";
  trip: {
    id?: string;
    name: string;
    destination?: string | null;
  } | null;
};

type TopbarNotification = TopbarInvitation | TopbarActivityNotification;

function TopbarContent() {
  const supabase = createClient();
  const { language, setLanguage, t } = useLanguage();

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
    let isMounted = true;

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      const fullName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0];

      if (!isMounted) return;
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
        const text = await res.text();
        const payload = text ? JSON.parse(text) : {};
        if (!res.ok) {
          throw new Error(payload.error || "Erreur chargement notifications");
        }
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
        const tripNotifications = Array.isArray(payload.activityNotifications)
          ? payload.activityNotifications.map(
              (notification: Omit<TopbarActivityNotification, "notificationType">) => ({
                ...notification,
                notificationType: notification.type,
              }),
            )
          : [];

        if (isMounted) {
          setNotifications([...incoming, ...accepted, ...tripNotifications]);
        }
      } catch (err) {
        console.error("Erreur chargement notifications:", err);
      }
    };

    getUser();
    const intervalId = window.setInterval(getUser, 15000);
    window.addEventListener("focus", getUser);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", getUser);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-2 border-b border-[#ead9bf] bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:justify-between sm:gap-3 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4 sm:max-w-sm md:max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9f411d] sm:left-3 sm:size-4" />
          <Input
            placeholder={t("searchDestinations")}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 rounded-lg border-[#ead9bf] bg-[#fff8ec] pl-8 text-[10px] shadow-none focus-visible:ring-[#c9603a]/30 sm:h-10 sm:pl-9 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:ml-4 sm:gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#ead9bf] bg-white text-gray-600 transition hover:bg-sidebar hover:text-[#9f411d] sm:size-10"
            aria-label="Notifications"
          >
            <Bell className="size-4 sm:size-5" />
            {notifications.length > 0 && (
              <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {notifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="fixed left-3 right-3 top-16 z-50 rounded-lg border border-[#ead9bf] bg-white p-2 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80">
              <div className="px-2 py-2 text-sm font-bold text-gray-900">
                {t("notifications")}
              </div>

              {notifications.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground">
                  {t("noInvitations")}
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
                      ) : notification.notificationType === "member_joined" ? (
                        <UserPlus className="mt-0.5 size-4 shrink-0 text-[#9f411d]" />
                      ) : (
                        <MailCheck className="mt-0.5 size-4 shrink-0 text-[#9f411d]" />
                      )}
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">
                          {notification.notificationType === "incoming"
                            ? t("tripInvitation")
                            : notification.notificationType === "accepted"
                              ? "Invitation accepted"
                              : notification.notificationType === "member_joined"
                                ? "Nouveau membre"
                                : "Nouvelle activite a voter"}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {notification.notificationType === "accepted"
                            ? `${notification.invitedEmail || t("memberAccepted")}`
                            : notification.trip?.name || "Trip notification"}
                          {notification.trip?.destination
                            ? ` - ${notification.trip.destination}`
                            : ""}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-[#9f411d]">
                          {notification.notificationType === "incoming"
                            ? t("checkEmailJoin")
                            : notification.notificationType === "activity_created"
                              ? notification.message
                              : notification.notificationType === "member_joined"
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

        <div className="flex rounded-lg border border-[#ead9bf] bg-[#fff8ec] p-0.5 shadow-sm sm:p-1">
          {(["en", "fr"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLanguage(item)}
              className={`h-7 rounded-md px-1.5 text-[10px] font-bold transition sm:h-8 sm:px-2.5 sm:text-xs ${
                language === item
                  ? "bg-[#9f411d] text-white shadow-sm"
                  : "text-[#7f2a07] hover:bg-white"
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 items-center gap-2 rounded-full border border-[#ead9bf] bg-white p-0.5 shadow-sm sm:gap-3 sm:rounded-lg sm:px-2.5 sm:py-1.5">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-800">{name}</p>
            <p className="text-xs text-muted-foreground">Traveler</p>
          </div>
          <Avatar className="size-7 ring-2 ring-[#f3e4da] sm:size-9">
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
