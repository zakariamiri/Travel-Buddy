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

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    cover_url: "",
    start_date: "",
    end_date: "",
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

  useEffect(() => {
    if (token) fetchTrips(token, filter);
  }, [token, filter]);

  const handleCreateTrip = async () => {
    setFormError("");

    if (!formData.name || !formData.destination) {
      setFormError("Le titre et la destination sont requis.");
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
        body: JSON.stringify(formData),
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
      });
      setDialogOpen(false);
      fetchTrips(token, filter);
    } catch (err) {
      setFormError("Impossible de contacter le serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fdf9f6]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <main className="flex-1 bg-background p-5 md:p-8">
          <section className="mb-6 rounded-lg border border-[#ead9bf] bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-xs font-semibold text-primary">
                  <i className="ri-suitcase-3-line text-sm" />
                  Travel Buddy Dashboard
                </div>
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-normal text-foreground md:text-4xl">
                  Welcome, {name}
                  <img src="/au-revoir.png" alt="wave" className="size-12 md:size-14" />
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Where next? Your collaborative itineraries are ready for the next adventure.
                </p>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger className="flex w-fit items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#9f411d]">
                  <i className="ri-add-line text-lg"></i>
                  New Trip
                </DialogTrigger>

            <DialogContent className="rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Create New Trip
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Trip Title
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
                    Destination
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
                    Cover Image
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                      const { data, error } = await supabase.storage
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
                      className="mt-2 h-24 w-full object-cover rounded-xl"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Start Date
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
                      End Date
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

                {formError && (
                  <p className="text-red-500 text-sm">{formError}</p>
                )}

                <Button
                  onClick={handleCreateTrip}
                  disabled={submitting}
                  className="bg-[#9f411d] hover:bg-[#8a3412] text-white rounded-xl mt-2 py-5"
                >
                  {submitting ? "Creating..." : "Create Trip"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
            </div>
          </section>

          <StatsCards />

          {}
          <div className="mb-6 flex flex-col justify-between gap-3 rounded-lg border border-[#ead9bf] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">My Trips</h2>
              <p className="text-sm text-muted-foreground">All your plans in one quiet place.</p>
            </div>

            <div className="flex w-fit gap-1 rounded-lg bg-[#f3e4da] p-1 shadow-inner">
              {["all", "upcoming", "past"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
                    filter === f
                      ? "bg-[#9f411d] text-white shadow"
                      : "text-gray-500 hover:text-[#7F2A07]"
                  }`}
                >
                  {f === "all" ? "All" : f === "upcoming" ? "Upcoming" : "Past"}
                </button>
              ))}
            </div>
          </div>

          {}
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-white">
              <p className="text-gray-400 text-lg animate-pulse">
                Loading trips...
              </p>
            </div>
          ) : trips.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-white">
              <i className="ri-map-pin-add-line text-4xl text-primary" />
              <p className="text-lg font-semibold text-foreground">No trips yet</p>
              <p className="text-sm text-muted-foreground">Create your first trip to start planning.</p>
            
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trips.map((trip) => (
              <a href={`/dashboard/${trip.id}`} key={trip.id} className="block">
                <TripCard
                  key={trip.id}
                  title={trip.name}
                  date={
                    trip.start_date && trip.end_date
                      ? `${new Date(trip.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(trip.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : "Dates TBD"
                  }
                  image={
                    trip.cover_url ||
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                  }
                  status={trip.status}
                />
              </a>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
