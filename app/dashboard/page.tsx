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
        `http://localhost:3001/api/trips?filter=${currentFilter}`,
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
      const res = await fetch("http://localhost:3001/api/trips", {
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
    <div className="flex min-h-screen bg-[#FFEEE0]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <main className="p-6">
          <h1 className="text-4xl font-bold pb-4 flex items-center gap-2">
            Welcome, {name}
            <img src="/au-revoir.png" alt="wave" className="w-17 h-17 ml-3" />
          </h1>

          <p className="text-gray-500 pb-7">
            Where next? Your collaborative itineraries are ready for the next
            adventure.
          </p>

          {}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="mb-6 bg-[#9f411d] text-white hover:bg-[#8a3412] font-medium text-md rounded-xl px-7 py-2 flex items-center gap-2 shadow-xl">
              <i className="ri-add-line text-md"></i>
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

          <StatsCards />

          {}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">My Trips</h2>

            <div className="bg-[#f3e4da] p-1 rounded-xl flex gap-1 shadow-inner">
              {["all", "upcoming", "past"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition capitalize ${
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
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-400 text-lg animate-pulse">
                Loading trips...
              </p>
            </div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <p className="text-gray-400 text-lg">No trips yet !</p>
              <p className="text-gray-300 text-sm">
                Click "New Trip" to get started 🌍
              </p>
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trips.map((trip) => (
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
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
