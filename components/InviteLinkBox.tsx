"use client";

import { createClient } from "@/utils/supabase/client";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type InviteLinkBoxProps = {
  tripId: string;
};

type InviteCodeResponse = {
  invite_code?: string;
  error?: string;
};

export default function InviteLinkBox({ tripId }: InviteLinkBoxProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error("Vous devez être connecté.");
      }

      const res = await fetch(
        `http://localhost:3001/api/trips/${tripId}/invite-code`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const text = await res.text();
      let payload: InviteCodeResponse = {};

      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Redémarre le backend puis réessaie.");
      }

      if (!res.ok) {
        throw new Error(payload.error || "Impossible de créer le lien.");
      }

      if (!payload.invite_code) {
        throw new Error("Code d'invitation introuvable.");
      }

      const inviteUrl = `${window.location.origin}/join?code=${payload.invite_code}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Lien copié !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={loading}
      className="text-[#9f411d] disabled:opacity-50"
      aria-label="Copier le lien d'invitation"
      title="Copier le lien d'invitation"
    >
      <i className="ri-share-line text-lg"></i>
    </button>
  );
}
