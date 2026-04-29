"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// Define the Stats type
interface Stats {
  activeTrip: {
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
        const res = await fetch("http://localhost:3001/api/stats", {
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Active Trip */}
      <div className="bg-[#EBD5C8] rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.02] transition">
        <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full w-fit font-semibold">
          ACTIVE TRIP
        </span>
        {stats?.activeTrip?.start_date ? (
          <>
            <h3 className="text-lg font-semibold mt-2">
              {stats.activeTrip.name}
            </h3>
            <p className="text-sm text-gray-600">
              {stats.activeTrip.daysUntilStart} days •{" "}
              {stats.activeTrip.collaborators} collaborators
            </p>
            <button className="text-[#9f411d] text-sm font-semibold mt-3">
              Open Itinerary →
            </button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mt-2 text-gray-400">
              No upcoming trip
            </h3>
            <p className="text-sm text-gray-400">
              Create a new trip to get started
            </p>
          </>
        )}
      </div>

      {/* Money */}
      <div className="bg-[#EBD5C8] rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition">
        <i className="ri-hand-coin-fill text-3xl mb-2 text-[#977109]"></i>
        <h3 className="text-xl font-bold">
          {stats?.pendingSplit != null
            ? `$${Number(stats.pendingSplit).toLocaleString("en-US", { minimumFractionDigits: 0 })}`
            : "—"}
        </h3>
        <p className="text-sm text-gray-600">Pending Split</p>
      </div>

      {/* Countdown / Next Trip */}
      <div className="bg-[#EBD5C8] rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition">
        <i className="ri-timer-flash-fill text-3xl mb-2 text-[#4A6547]"></i>
        <h3 className="text-xl font-bold">
          {stats?.daysUntilNextTrip != null
            ? `${stats.daysUntilNextTrip} days`
            : "—"}
        </h3>
        <p className="text-sm text-gray-600">until your next trip</p>
      </div>
    </div>
  );
}
