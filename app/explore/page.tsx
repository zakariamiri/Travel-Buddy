"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { apiUrl } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  MapPin,
  Route,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TripMember = {
  id: string;
  full_name: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role: "owner" | "contributor" | "viewer";
};

type ExploreTrip = {
  id: string;
  name: string;
  destination: string;
  cover_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: "ONGOING" | "CONFIRMED" | "PLANNING" | "PAST";
  role?: string;
  members?: TripMember[];
};

type ExploreActivity = {
  id: string;
  title: string;
  type?: string | null;
  location?: string | null;
  notes?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  status?: "pending" | "approved" | "rejected";
  price_per_person?: number | string | null;
  image_url?: string | null;
};

const fallbackCover =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee";

function formatDate(date?: string | null) {
  if (!date) return "Date TBD";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTripDays(trip?: ExploreTrip | null) {
  if (!trip?.start_date || !trip.end_date) return 0;
  const start = new Date(trip.start_date).getTime();
  const end = new Date(trip.end_date).getTime();
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

function getProgress(trip?: ExploreTrip | null) {
  if (!trip?.start_date || !trip.end_date) return 0;
  const start = new Date(trip.start_date).getTime();
  const end = new Date(trip.end_date).getTime();
  const now = Date.now();

  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function pickCurrentTrip(trips: ExploreTrip[]) {
  const sorted = [...trips].sort((a, b) => {
    const first = a.start_date ? new Date(a.start_date).getTime() : Infinity;
    const second = b.start_date ? new Date(b.start_date).getTime() : Infinity;
    return first - second;
  });

  return (
    sorted.find((trip) => trip.status === "ONGOING") ||
    sorted.find((trip) => trip.status === "CONFIRMED") ||
    sorted.find((trip) => trip.status === "PLANNING") ||
    sorted[0] ||
    null
  );
}

export default function ExplorePage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [trips, setTrips] = useState<ExploreTrip[]>([]);
  const [activities, setActivities] = useState<ExploreActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [token, setToken] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    const loadTrips = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return;
      setToken(accessToken);

      try {
        const response = await fetch(apiUrl("/api/trips?filter=all"), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        const loadedTrips = Array.isArray(data) ? data : [];
        setTrips(loadedTrips);
        setSelectedTripId(pickCurrentTrip(loadedTrips)?.id || null);
      } catch (error) {
        console.error("Error loading explore trips:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [router, supabase.auth]);

  const selectedTrip =
    trips.find((trip) => trip.id === selectedTripId) || pickCurrentTrip(trips);

  useEffect(() => {
    const loadActivities = async () => {
      if (!selectedTrip?.id || !token) {
        setActivities([]);
        return;
      }

      setLoadingActivities(true);
      try {
        const response = await fetch(
          apiUrl(`/api/trips/${selectedTrip.id}/activities`),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading explore activities:", error);
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    loadActivities();
  }, [selectedTrip?.id, token]);

  const mapUrl = selectedTrip
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        selectedTrip.destination,
      )}&output=embed`
    : "";
  const progress = getProgress(selectedTrip);
  const tripDays = getTripDays(selectedTrip);
  const owner = selectedTrip?.members?.find((member) => member.role === "owner");

  return (
    <div className="flex min-h-screen bg-[#fdf9f6]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="flex-1 bg-background p-5 md:p-8">
          <section className="mb-6 rounded-lg border border-[#ead9bf] bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-xs font-semibold text-primary">
                  <Compass className="size-3.5" />
                  Explore
                </div>
                <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
                  Trip map
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Visualize the current trip, its destination, and the key
                  details before planning what comes next.
                </p>
              </div>

              {selectedTrip && (
                <Link
                  href={`/dashboard/${selectedTrip.id}`}
                  className="w-fit rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#9f411d]"
                >
                  Ouvrir le trip
                </Link>
              )}
            </div>
          </section>

          {loading ? (
            <div className="flex h-80 items-center justify-center rounded-lg border border-dashed bg-white">
              <p className="text-gray-400 animate-pulse">Loading map...</p>
            </div>
          ) : !selectedTrip ? (
            <div className="flex h-80 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-white">
              <MapPin className="size-10 text-primary" />
              <p className="text-lg font-semibold text-foreground">
                Aucun trip a explorer
              </p>
              <p className="text-sm text-muted-foreground">
                Cree un voyage depuis le dashboard pour afficher sa carte.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex min-w-0 flex-col gap-6">
                <section className="overflow-hidden rounded-lg border border-[#ead9bf] bg-white shadow-sm">
                  <div className="relative h-[520px] w-full">
                    <iframe
                      title={`Map ${selectedTrip.destination}`}
                      src={mapUrl}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/95 px-4 py-3 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Destination
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-lg font-bold text-foreground">
                        <MapPin className="size-4 text-primary" />
                        {selectedTrip.destination}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-[#ead9bf] bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-xs font-semibold text-primary">
                        <Sparkles className="size-3.5" />
                        Activites associees
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Programme du trip
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Les activites planifiees pour {selectedTrip.name}.
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-[#f3e4da] px-3 py-1 text-sm font-bold text-primary">
                      {activities.length} activites
                    </span>
                  </div>

                  {loadingActivities ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                      <p className="text-sm text-gray-400 animate-pulse">
                        Loading activities...
                      </p>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-[#fff8ec]">
                      <Route className="size-8 text-primary" />
                      <p className="text-sm font-semibold text-foreground">
                        Aucune activite pour ce trip
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {activities.map((activity) => (
                        <article
                          key={activity.id}
                          className="rounded-lg border border-[#ead9bf] bg-[#fffdf9] p-4 transition hover:border-primary/60 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-base font-bold text-foreground">
                                {activity.title}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="size-3.5 shrink-0" />
                                <span className="truncate">
                                  {activity.location || "No location"}
                                </span>
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-sidebar px-2.5 py-1 text-xs font-bold text-primary">
                              {activity.status || "pending"}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-md bg-white p-2">
                              <p className="text-xs font-semibold text-gray-500">
                                Date
                              </p>
                              <p className="font-bold text-foreground">
                                {formatDate(activity.scheduled_date)}
                              </p>
                            </div>
                            <div className="rounded-md bg-white p-2">
                              <p className="text-xs font-semibold text-gray-500">
                                Time
                              </p>
                              <p className="font-bold text-foreground">
                                {activity.scheduled_time?.slice(0, 5) ||
                                  "All day"}
                              </p>
                            </div>
                          </div>

                          {(activity.type || activity.price_per_person) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {activity.type && (
                                <span className="rounded-full bg-[#f3e4da] px-2.5 py-1 text-xs font-semibold text-primary">
                                  {activity.type}
                                </span>
                              )}
                              {activity.price_per_person && (
                                <span className="rounded-full bg-[#eaf1e8] px-2.5 py-1 text-xs font-semibold text-secondary">
                                  {activity.price_per_person} / person
                                </span>
                              )}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <aside className="flex flex-col gap-4">
                <section className="overflow-hidden rounded-lg border border-[#ead9bf] bg-white shadow-sm">
                  <div className="relative h-44">
                    <img
                      src={selectedTrip.cover_url || fallbackCover}
                      alt={selectedTrip.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary">
                        {selectedTrip.status}
                      </span>
                      <h2 className="mt-3 line-clamp-2 text-2xl font-bold">
                        {selectedTrip.name}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-[#fff8ec] p-3">
                        <CalendarDays className="mb-2 size-4 text-primary" />
                        <p className="text-xs font-semibold text-gray-500">
                          Start
                        </p>
                        <p className="text-sm font-bold">
                          {formatDate(selectedTrip.start_date)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#fff8ec] p-3">
                        <Clock3 className="mb-2 size-4 text-primary" />
                        <p className="text-xs font-semibold text-gray-500">
                          End
                        </p>
                        <p className="text-sm font-bold">
                          {formatDate(selectedTrip.end_date)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#ead9bf] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">
                          Progression
                        </span>
                        <span className="text-sm font-bold text-primary">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#f3e4da]">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-[#ead9bf] p-3">
                        <Route className="mb-2 size-4 text-secondary" />
                        <p className="text-xs font-semibold text-gray-500">
                          Duration
                        </p>
                        <p className="text-sm font-bold">
                          {tripDays || "-"} days
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#ead9bf] p-3">
                        <Users className="mb-2 size-4 text-secondary" />
                        <p className="text-xs font-semibold text-gray-500">
                          Members
                        </p>
                        <p className="text-sm font-bold">
                          {selectedTrip.members?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-sidebar p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
                        Owner
                      </p>
                      <p className="mt-1 text-sm font-bold text-foreground">
                        {owner?.full_name || owner?.email || "Unknown"}
                      </p>
                    </div>
                  </div>
                </section>

                {trips.length > 1 && (
                  <section className="rounded-lg border border-[#ead9bf] bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
                      Other trips
                    </h3>
                    <div className="space-y-2">
                      {trips.slice(0, 5).map((trip) => (
                        <button
                          key={trip.id}
                          type="button"
                          onClick={() => setSelectedTripId(trip.id)}
                          className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                            trip.id === selectedTrip.id
                              ? "bg-primary text-white"
                              : "hover:bg-sidebar"
                          }`}
                        >
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {trip.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
