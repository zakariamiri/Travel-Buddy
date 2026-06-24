"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

type JoinResponse = {
  error?: string;
  trip?: {
    id?: string;
  };
};

function parseApiResponse(text: string): JoinResponse {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Backend indisponible. Lance le serveur backend puis réessaie.");
  }
}

function JoinTripContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [message, setMessage] = useState("Vérification de l'invitation...");

  useEffect(() => {
    const joinTrip = async () => {
      const code = searchParams.get("code");

      if (!code) {
        setMessage("Code d'invitation manquant.");
        toast.error("Code d'invitation manquant.");
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        router.replace(`/signup?redirect=${encodeURIComponent(`/join?code=${code}`)}`);
        return;
      }

      try {
        const res = await fetch(apiUrl("/api/members/join"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ invite_code: code }),
        });
        const payload = parseApiResponse(await res.text());

        if (!res.ok) {
          throw new Error(payload.error || "Impossible de rejoindre le voyage.");
        }

        if (payload.trip?.id) {
          await fetch("/api/member-joined-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ tripId: payload.trip.id }),
          });
        }

        setMessage("Voyage rejoint. Redirection...");
        toast.success("Vous avez rejoint le voyage avec succès ! 🎉");
        setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 1500);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Impossible de rejoindre le voyage.";
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    joinTrip();
  }, [router, searchParams, supabase.auth]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFEEE0] px-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#9f411d] border-t-transparent" />
        <h1 className="font-heading text-2xl font-bold text-gray-950">
          Travel Buddy
        </h1>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      </div>
    </main>
  );
}

export default function JoinTripPage() {
  return (
    <Suspense fallback={null}>
      <JoinTripContent />
    </Suspense>
  );
}
