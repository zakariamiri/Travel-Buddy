"use client";

import { ArrowRight, HandCoins } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";

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

const cardClass =
  "flex flex-col justify-between rounded-lg border border-[#ead9bf] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-[#9f411d] transition-colors hover:text-[#7f2a07]"
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

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

        setStats(await res.json());
      } catch (err) {
        console.error("Erreur stats:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>Error: {error}</p>
        <p>Please ensure the backend server is running and accessible.</p>
      </div>
    );
  }

  const budgetHref = stats?.activeTrip?.id
    ? `/dashboard/${stats.activeTrip.id}/budget`
    : "/dashboard";

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className={cardClass}>
        <span className="w-fit rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-bold text-secondary">
          ACTIVE TRIP
        </span>
        {stats?.activeTrip?.start_date ? (
          <>
            <h3 className="mt-4 text-xl font-bold text-foreground">
              {stats.activeTrip.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.activeTrip.daysUntilStart} days |{" "}
              {stats.activeTrip.collaborators} collaborators
            </p>
            <ActionLink href={`/dashboard/${stats.activeTrip.id}`}>
              Open Itinerary
            </ActionLink>
          </>
        ) : (
          <>
            <h3 className="mt-4 text-lg font-semibold text-gray-400">
              No upcoming trip
            </h3>
            <p className="text-sm text-gray-400">Create a new trip to get started</p>
          </>
        )}
      </div>

      <div className={cardClass}>
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#f7ead0] text-[#977109]">
          <HandCoins className="size-5" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-foreground">
          {stats?.pendingSplit != null
            ? `${Number(stats.pendingSplit).toLocaleString("fr-MA", {
                minimumFractionDigits: 0,
              })} DH`
            : "-"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Trip Expenses</p>
        <ActionLink href={budgetHref}>Open Budget</ActionLink>
      </div>

      <div className={cardClass}>
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10 text-[#4A6547]">
          <i className="ri-timer-flash-fill text-xl" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-foreground">
          {stats?.daysUntilNextTrip != null
            ? `${stats.daysUntilNextTrip} days`
            : "-"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">until your next trip</p>
      </div>
    </div>
  );
}
