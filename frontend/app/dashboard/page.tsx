"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import TripCard from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import StatsCards from "@/components/StatsCards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import {
  Bell,
  Bot,
  MailCheck,
  MessageCircle,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

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

type DashboardInvitation = {
  id: string;
  inviteCode: string;
  createdAt: string;
  trip: {
    id: string;
    name: string;
    destination?: string | null;
  } | null;
};

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [invitations, setInvitations] = useState<DashboardInvitation[]>([]);
  const [showInvitations, setShowInvitations] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    cover_url: "",
    start_date: "",
    end_date: "",
    budget_total: "5000",
  });
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      const fullName =
        data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0];
      setName(fullName);

      const { data: sessionData } = await supabase.auth.getSession();
      setToken(sessionData.session?.access_token || "");
    };

    init();
  }, []);

  const fetchTrips = async (currentToken: string, currentFilter: string) => {
    if (!currentToken) return;
    setLoading(true);
    try {
      const res = await fetch(
        apiUrl(`/api/trips?filter=${currentFilter}`),
        { headers: { Authorization: `Bearer ${currentToken}` } },
      );
      const data = await res.json();
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async (currentToken: string) => {
    if (!currentToken) return;

    try {
      const res = await fetch("/api/invitations", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data.error || "Erreur chargement invitations");
      }
      setInvitations(Array.isArray(data.invitations) ? data.invitations : []);
    } catch (err) {
      console.error("Erreur chargement invitations:", err);
    }
  };

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTrips(token, filter);
      fetchInvitations(token);
    }
  }, [token, filter]);

  const assistantTrip =
    trips.find((trip) => trip.status === "ONGOING") ||
    trips.find((trip) => trip.status === "PLANNING") ||
    trips[0];

  const handleCreateTrip = async () => {
    setFormError("");

    if (!formData.name || !formData.destination) {
      setFormError("Le titre et la destination sont requis.");
      return;
    }

    const budgetTotal = Number(formData.budget_total);
    if (!Number.isFinite(budgetTotal) || budgetTotal < 0) {
      setFormError("Le budget doit etre un montant valide.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/trips"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          budget_total: budgetTotal,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Erreur lors de la création.");
        return;
      }

      setFormData({
        name: "",
        destination: "",
        cover_url: "",
        start_date: "",
        end_date: "",
        budget_total: "5000",
      });
      setDialogOpen(false);
      fetchTrips(token, filter);
    } catch {
      setFormError("Impossible de contacter le serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fdf9f6]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="flex-1 bg-background p-4 pb-28 sm:p-5 sm:pb-28 md:p-8 lg:pb-8">
          <section className="mb-6 rounded-lg border border-[#ead9bf] bg-white p-4 shadow-sm sm:p-5 md:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-xs font-semibold text-primary">
                  <i className="ri-suitcase-3-line text-sm" />
                  {t("travelBuddyDashboard")}
                </div>
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-normal text-foreground sm:gap-3 md:text-4xl">
                  <span className="min-w-0 break-words">{t("welcome")}, {name}</span>
                  <img src="/au-revoir.png" alt="wave" className="size-12 md:size-14" />
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {t("dashboardSubtitle")}
                </p>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger className="group flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#dfb99d] bg-white px-2.5 pr-4 text-sm font-bold text-[#7f2a07] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#c97950] hover:shadow-[0_8px_20px_rgba(127,42,7,0.14)] sm:w-fit">
                  <span className="flex size-7 items-center justify-center rounded-md bg-[#9f411d] text-white transition-colors group-hover:bg-[#7f2a07]">
                    <Plus className="size-4" />
                  </span>
                  {t("createTrip")}
                </DialogTrigger>

                <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                      {t("createNewTrip")}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="flex flex-col gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("tripTitle")}
                      </label>
                      <Input
                        placeholder="e.g. Paris Adventure"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("destination")}
                      </label>
                      <Input
                        placeholder="e.g. Paris, France"
                        value={formData.destination}
                        onChange={(e) =>
                          setFormData({ ...formData, destination: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("coverImage")}
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                          const { error } = await supabase.storage
                            .from("trip-covers")
                            .upload(fileName, file);

                          if (error) {
                            console.error("Upload error:", error.message);
                            return;
                          }

                          const { data: urlData } = supabase.storage
                            .from("trip-covers")
                            .getPublicUrl(fileName);

                          setFormData({
                            ...formData,
                            cover_url: urlData.publicUrl,
                          });
                        }}
                      />

                      {/* Aperçu de l'image */}
                      {formData.cover_url && (
                        <img
                          src={formData.cover_url}
                          alt="Trip cover preview"
                          className="mt-2 h-24 w-full object-cover rounded-xl"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          {t("startDate")}
                        </label>
                        <Input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) =>
                            setFormData({ ...formData, start_date: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          {t("endDate")}
                        </label>
                        <Input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) =>
                            setFormData({ ...formData, end_date: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="trip-budget"
                        className="text-sm font-medium text-gray-700"
                      >
                        {t("totalBudgetDh")}
                      </label>
                      <div className="relative mt-1">
                        <i className="ri-wallet-3-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                        <Input
                          id="trip-budget"
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={formData.budget_total}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              budget_total: e.target.value,
                            })
                          }
                          placeholder="5000"
                          className="pl-10"
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("budgetHint")}
                      </p>
                    </div>

                    {formError && (
                      <p className="text-red-500 text-sm">{formError}</p>
                    )}

                    <Button
                      onClick={handleCreateTrip}
                      disabled={submitting}
                      className="bg-[#9f411d] hover:bg-[#8a3412] text-white rounded-xl mt-2 py-5"
                    >
                      {submitting ? t("creating") : t("createTrip")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          {showInvitations && invitations.length > 0 && (
            <section className="mb-6 rounded-lg border border-[#f0c78d] bg-[#fff8ed] p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#9f411d] text-white">
                    <Bell className="size-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-[#5f240b]">
                        {t("tripInvitation")}
                      </h2>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#9f411d] shadow-sm">
                        {invitations.length} {t("pendingInvitation")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#7a452d]">
                      {t("checkEmailInvitation")}
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      {invitations.slice(0, 3).map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex flex-col gap-2 rounded-lg border border-[#f2d9b8] bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {invitation.trip?.name || "Trip invitation"}
                            </p>
                            {invitation.trip?.destination && (
                              <p className="text-xs text-muted-foreground">
                                {invitation.trip.destination}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() =>
                              router.push(`/join?code=${invitation.inviteCode}`)
                            }
                            className="h-9 rounded-lg bg-[#9f411d] px-3 text-xs font-bold text-white hover:bg-[#8a3412]"
                          >
                            <MailCheck className="mr-2 size-4" />
                            {t("join")}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInvitations(false)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#8a5535] transition hover:bg-white"
                  aria-label="Dismiss invitation notification"
                >
                  <X className="size-4" />
                </button>
              </div>
            </section>
          )}

          <StatsCards />

          <section className="mb-6 overflow-hidden rounded-lg border border-[#ead9bf] bg-white shadow-[0_16px_40px_rgba(127,42,7,0.12)]">
            <div className="flex flex-col items-start justify-between gap-5 bg-[linear-gradient(135deg,#fffaf4_0%,#ffffff_48%,#f5e5dc_100%)] p-4 sm:p-5 md:flex-row md:items-center md:p-6">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex size-16 shrink-0 items-center justify-center sm:size-20">
                  <span className="absolute inset-0 rounded-full bg-[#d76135]/20 animate-ping" />
                  <span className="absolute inset-2 rounded-full bg-[#f2c8ad]/60 animate-pulse" />
                  <span className="relative flex size-12 items-center justify-center rounded-full bg-[#9f411d] text-white shadow-[0_12px_28px_rgba(159,65,29,0.32)] sm:size-14">
                    <Bot className="size-6 sm:size-7" />
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#fff1d6] px-3 py-1 text-xs font-bold text-[#8a3412]">
                    <Sparkles className="size-3.5" />
                    {t("assistantBadge")}
                  </div>
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    {t("assistantCtaTitle")}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {t("assistantCtaText")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!assistantTrip}
                onClick={() => assistantTrip && router.push(`/dashboard/${assistantTrip.id}/assistant`)}
                className="group flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#9f411d] px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(159,65,29,0.22)] transition hover:-translate-y-0.5 hover:bg-[#7f3417] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
              >
                <MessageCircle className="size-4" />
                {t("openChatbot")}
              </button>
            </div>
          </section>

          {}
          <div className="mb-6 flex flex-col justify-between gap-3 rounded-lg border border-[#ead9bf] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">{t("myTrips")}</h2>
              <p className="text-sm text-muted-foreground">{t("tripsSubtitle")}</p>
            </div>

            <div className="flex w-full gap-1 overflow-x-auto rounded-lg bg-[#f3e4da] p-1 shadow-inner sm:w-fit">
              {["all", "upcoming", "past"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold capitalize transition sm:flex-none sm:px-4 ${filter === f
                      ? "bg-[#9f411d] text-white shadow"
                      : "text-gray-500 hover:text-[#7F2A07]"
                    }`}
                >
                  {f === "all" ? t("all") : f === "upcoming" ? t("upcoming") : t("past")}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-white">
            <p className="text-gray-400 text-lg animate-pulse">
              {t("loadingTrips")}
            </p>
          </div>
          ) : trips.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-white">
            <i className="ri-map-pin-add-line text-4xl text-primary" />
            <p className="text-lg font-semibold text-foreground">{t("noTripsYet")}</p>
            <p className="text-sm text-muted-foreground">{t("createFirstTrip")}</p>

          </div>
          ) : (
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                id={trip.id}
                title={trip.name}
                destination={trip.destination}
                startDate={trip.start_date}
                endDate={trip.end_date}
                budgetTotal={trip.budget_total}
                date={
                  trip.start_date && trip.end_date
                    ? `${new Date(trip.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(trip.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : "Dates TBD"
                }
                image={
                  trip.cover_url ||
                  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                }
                coverUrl={trip.cover_url}
                status={trip.status}
                role={trip.role}
                members={trip.members || []}
                onChanged={() => fetchTrips(token, filter)}
              />
            ))}
          </div>
          )}
        </main>
      </div>
    </div>
  );
}
