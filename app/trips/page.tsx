"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import TripCalendar from "@/components/TripCalendar";
import { useLanguage } from "@/components/LanguageProvider";
import { apiUrl } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";
import { CalendarDays, MapPin, PlaneTakeoff, Users, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DashboardTrip = {
  id: string;
  name: string;
  destination: string;
  cover_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_total?: number;
  status: "CONFIRMED" | "PLANNING" | "ONGOING" | "PAST";
  role?: string;
  members?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string | null;
    role: "owner" | "admin" | "contributor" | "viewer";
    joined_at?: string | null;
  }[];
};

function formatDate(date?: string | null) {
  if (!date) return "Date TBD";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TripsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(apiUrl("/api/trips?filter=all"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setTrips(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erreur chargement trips:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [router, supabase.auth]);

  const activeTrips = useMemo(
    () => trips.filter((trip) => trip.status === "ONGOING" || trip.status === "PLANNING"),
    [trips],
  );

  return (
    <div className="flex min-h-screen bg-[#fdf9f6]">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Topbar />

        <main className="flex-1 bg-background p-5 md:p-8">
          <section className="mb-6 overflow-hidden rounded-lg border border-[#ead9bf] bg-white shadow-[0_18px_45px_rgba(127,42,7,0.1)]">
            <div className="flex flex-col justify-between gap-5 bg-[linear-gradient(135deg,#fffaf4_0%,#ffffff_50%,#f3e4da_100%)] p-6 lg:flex-row lg:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fff1d6] px-3 py-1 text-xs font-bold text-[#8a3412]">
                  <CalendarDays className="size-3.5" />
                  {t("tripsCalendar")}
                </div>
                <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
                  {t("planTimeline")}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {t("planTimelineText")}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#ead9bf] bg-white/80 px-4 py-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#9f411d]">{trips.length}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{t("trips")}</p>
                </div>
                <div className="rounded-lg border border-[#ead9bf] bg-white/80 px-4 py-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#9f411d]">{activeTrips.length}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{t("active")}</p>
                </div>
                <div className="rounded-lg border border-[#ead9bf] bg-white/80 px-4 py-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#9f411d]">
                    {trips.reduce((sum, trip) => sum + (trip.members?.length || 0), 0)}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">{t("members")}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <section className="min-w-0">
              {loading ? (
                <div className="flex h-[520px] items-center justify-center rounded-lg border border-dashed border-[#ead9bf] bg-white">
                  <p className="animate-pulse text-sm font-semibold text-muted-foreground">
                    {t("loadingCalendar")}
                  </p>
                </div>
              ) : (
                <TripCalendar
                  trips={trips}
                  onTripClick={(tripId) => router.push(`/dashboard/${tripId}`)}
                />
              )}
            </section>

            <aside className="rounded-lg border border-[#ead9bf] bg-white p-4 shadow-[0_14px_35px_rgba(127,42,7,0.08)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t("upcomingTrips")}</h2>
                  <p className="text-xs text-muted-foreground">{t("quickAccessSchedule")}</p>
                </div>
                <PlaneTakeoff className="size-5 text-[#9f411d]" />
              </div>

              <div className="space-y-3">
                {trips.length === 0 && !loading ? (
                  <div className="rounded-lg border border-dashed border-[#ead9bf] bg-[#fffaf4] p-4 text-sm text-muted-foreground">
                    {t("noScheduledTrips")}
                  </div>
                ) : (
                  trips.slice(0, 8).map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => router.push(`/dashboard/${trip.id}`)}
                      className="w-full rounded-lg border border-[#ead9bf] bg-[#fffaf4] p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#c97950] hover:bg-white hover:shadow-[0_10px_24px_rgba(127,42,7,0.12)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{trip.name}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3.5" />
                            {trip.destination}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#f3d8c4] px-2 py-1 text-[10px] font-bold uppercase text-[#7f2a07]">
                          {trip.status === "CONFIRMED"
                            ? t("confirmed")
                            : trip.status === "PLANNING"
                              ? t("planning")
                              : trip.status === "ONGOING"
                                ? t("ongoing")
                                : t("past")}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarDays className="size-3.5 text-[#9f411d]" />
                          {formatDate(trip.start_date)}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="size-3.5 text-[#9f411d]" />
                          {trip.members?.length || 0} {t("members").toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#7f2a07]">
                        <WalletCards className="size-3.5" />
                        {(trip.budget_total || 0).toLocaleString("fr-MA")} DH
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
