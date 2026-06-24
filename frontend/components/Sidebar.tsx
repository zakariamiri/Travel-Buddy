"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { apiUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function Sidebar() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveTrip = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      try {
        const response = await fetch(apiUrl("/api/stats"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const stats = await response.json();
        setActiveTripId(stats?.activeTrip?.id || null);
      } catch (error) {
        console.error("Error loading active trip:", error);
      }
    };

    fetchActiveTrip();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleExpensesClick = async () => {
    if (activeTripId) {
      router.push(`/dashboard/${activeTripId}/budget`);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/trips?filter=all"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const trips = await response.json();
      const firstTripId = Array.isArray(trips) ? trips[0]?.id : null;

      if (firstTripId) {
        router.push(`/dashboard/${firstTripId}/budget`);
        return;
      }
    } catch (error) {
      console.error("Error opening expenses:", error);
    }

    router.push("/dashboard");
  };

  const navItems = [
    {
      label: t("dashboard"),
      icon: "ri-home-5-line",
      onClick: () => router.push("/dashboard"),
    },
    {
      label: t("trips"),
      icon: "ri-flight-takeoff-line",
      onClick: () => router.push("/trips"),
    },
    {
      label: t("explore"),
      icon: "ri-map-2-line",
      onClick: () => router.push("/explore"),
    },
    {
      label: t("expenses"),
      icon: "ri-wallet-3-line",
      onClick: handleExpensesClick,
    },
  ];

  return (
    <>
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-3 border-r bg-[#FFEFD4] p-4 lg:flex">
      <img src="/logo2.png" alt="Travel Buddy" className="mb-8 mt-4 mr-2" />
      {/* Dashboard */}
      <Button
        onClick={() => router.push("/dashboard")}
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
      >
        <i className="ri-home-5-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        {t("dashboard")}
      </Button>

      {/* Trips */}
      <Button
        onClick={() => router.push("/trips")}
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
      >
        <i className="ri-flight-takeoff-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        {t("trips")}
      </Button>

      {/* Explore */}
      <Button
        onClick={() => router.push("/explore")}
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
      >
        <i className="ri-map-2-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        {t("explore")}
      </Button>

      {/* Expenses */}
      <Button
        onClick={handleExpensesClick}
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
      >
        <i className="ri-wallet-3-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        {t("expenses")}
      </Button>

      {/* Settings */}
      <Button
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
      >
        <i className="ri-settings-3-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        {t("settings")}
      </Button>

      <div className="mt-auto pt-4">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                     bg-transparent text-gray-800
                     transition-all duration-200
                     hover:bg-[#9f411d] hover:text-white"
        >
          <i className="ri-logout-box-r-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
          {t("logout")}
        </Button>
      </div>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ead9bf] bg-[#FFEFD4]/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(127,42,7,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1.5 py-2 text-xs font-semibold text-gray-800 transition hover:bg-[#9f411d] hover:text-white"
          >
            <i className={`${item.icon} text-xl`} />
            <span className="max-w-full truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
    </>
  );
}
