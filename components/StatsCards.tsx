"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { apiUrl } from "@/lib/api";

// Define the Stats type
interface Stats {
  activeTrip: {
    id: string;
    name: string;
    daysUntilStart: number;
    collaborators: number;
    start_date: string;
  } | null;
  pendingSplit: number;
  daysUntilNextTrip: number | null;
}

const supabase = createClient();

export default function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Authentication token is missing.");
        return;
      }

      try {
        const res = await fetch(apiUrl("/api/stats"), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch stats: ${res.statusText}`);
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Erreur stats:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred.",
        );
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="text-red-500 text-center">
        <p>Error: {error}</p>
        <p>Please ensure the backend server is running and accessible.</p>
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Active Trip */}
      <div className="flex flex-col justify-between rounded-lg border border-[#ead9bf] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <span className="w-fit rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-bold text-secondary">
          ACTIVE TRIP
        </span>
        {stats?.activeTrip?.start_date ? (
          <>
            <h3 className="mt-4 text-xl font-bold text-foreground">
              {stats.activeTrip.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.activeTrip.daysUntilStart} days •{" "}
              {stats.activeTrip.collaborators} collaborators
            </p>
            <Link
              href={`/dashboard/${stats.activeTrip.id}`}
              className="mt-4 text-sm font-bold text-[#9f411d]"
            >
              Open Itinerary →
            </Link>
          </>
        ) : (
          <>
            <h3 className="mt-4 text-lg font-semibold text-gray-400">
              No upcoming trip
            </h3>
            <p className="text-sm text-gray-400">
              Create a new trip to get started
            </p>
          </>
        )}
      </div>

      {/* Money */}
      <Link
        href={stats?.activeTrip?.id ? `/dashboard/${stats.activeTrip.id}/budget` : "/dashboard"}
        className="flex flex-col items-center justify-center rounded-lg border border-[#ead9bf] bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-accent/20 text-[#977109]">
          <i className="ri-hand-coin-fill text-2xl"></i>
        </div>
        <h3 className="text-2xl font-bold text-foreground">
          {stats?.pendingSplit != null
            ? `${Number(stats.pendingSplit).toLocaleString("fr-MA", { minimumFractionDigits: 0 })} DH`
            : "-"}
        </h3>
        <p className="text-sm text-muted-foreground">Pending Split</p>
        <span className="mt-2 text-xs font-semibold text-[#9f411d]">
          Open budget →
        </span>
      </Link>

      {/* Countdown / Next Trip */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-[#ead9bf] bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-secondary/10 text-[#4A6547]">
          <i className="ri-timer-flash-fill text-2xl"></i>
        </div>
        <h3 className="text-2xl font-bold text-foreground">
          {stats?.daysUntilNextTrip != null
            ? `${stats.daysUntilNextTrip} days`
            : "-"}
        </h3>
        <p className="text-sm text-muted-foreground">until your next trip</p>
      </div>
    </div>
  );
}
