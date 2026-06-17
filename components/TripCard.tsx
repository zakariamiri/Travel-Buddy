"use client";

import InviteLinkBox from "@/components/InviteLinkBox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiUrl } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowUpRight,
  CalendarDays,
  Crown,
  MoreHorizontal,
  Pencil,
  Trash2,   
  Users,
} from "lucide-react";
import md5 from "md5";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TripMember = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string | null;
  role: "owner" | "contributor" | "viewer";
  joined_at: string | null;
};

type PartialTripMember = Partial<Omit<TripMember, "role">> & {
  role?: "owner" | "contributor" | "viewer";
};

type TripCardProps = {
  id: string;
  title: string;
  date: string;
  image: string;
  coverUrl?: string | null;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  budgetTotal?: number;
  status: "CONFIRMED" | "PLANNING" | "ONGOING" | "PAST";
  role?: string;
  members?: PartialTripMember[];
  onChanged?: () => void;
};

const DEFAULT_IMAGE = "https://www.gravatar.com/avatar/0?d=identicon";

function getInitials(member: Pick<TripMember, "full_name" | "email">) {
  const label = member.full_name || member.email || "User";
  return label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarUrl(member: Pick<TripMember, "avatar_url" | "email">) {
  if (member.avatar_url) return member.avatar_url;

  const email = member.email || "";
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

function MemberAvatar({
  member,
  isOwner = false,
}: {
  member: TripMember;
  isOwner?: boolean;
}) {
  const label = member.full_name || member.email || "User";

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="relative">
          {isOwner && (
            <Crown className="absolute -top-3 left-1/2 z-10 h-3 w-3 -translate-x-1/2 fill-yellow-400 text-yellow-500" />
          )}
          <Avatar
            className={`h-8 w-8 ${
              isOwner ? "ring-2 ring-[#9f411d]" : "ring-2 ring-white"
            }`}
          >
            <AvatarImage src={getAvatarUrl(member)} alt={label} />
            <AvatarFallback className="bg-[#FFEEE0] text-xs font-semibold text-[#9f411d]">
              {getInitials(member)}
            </AvatarFallback>
          </Avatar>
        </div>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default function TripCard({
  id,
  title,
  date,
  image,
  coverUrl,
  destination,
  startDate,
  endDate,
  budgetTotal = 5000,
  status,
  role,
  members: initialMembers = [],
  onChanged,
}: TripCardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    name: title,
    destination,
    cover_url: coverUrl || "",
    start_date: startDate || "",
    end_date: endDate || "",
    budget_total: String(budgetTotal),
  });
  const [members, setMembers] = useState<TripMember[]>(
    initialMembers.map((member) => ({
      id: member.id || `${member.role}-${member.full_name || "member"}`,
      full_name: member.full_name || member.email || "User",
      avatar_url: member.avatar_url || null,
      email: member.email || null,
      role: member.role || "contributor",
      joined_at: member.joined_at || null,
    })),
  );

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const res = await fetch(apiUrl(`/api/trips/${id}/members`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const text = await res.text();
      const payload = text ? JSON.parse(text) : [];
      if (Array.isArray(payload) && payload.length > 0) {
        setMembers(payload);
      }
    };

    fetchMembers();
  }, [id, supabase.auth]);

  const statusStyle = {
    CONFIRMED: "bg-[#9f411d] text-white ring-[#7f2a07]/20",
    PLANNING: "bg-[#f3d8c4] text-[#7f2a07] ring-[#d8aa86]/40",
    ONGOING: "bg-[#b85b35] text-white ring-[#8f3c1b]/20",
    PAST: "bg-[#e8e0da] text-[#6f5d53] ring-[#cfc2b9]/50",
  };

  const owner = members.find((member) => member.role === "owner");
  const contributors = members.filter((member) => member.role !== "owner");
  const visibleContributors = contributors.slice(0, owner ? 3 : 4);
  const extraCount = Math.max(
    members.length - (owner ? 1 : 0) - visibleContributors.length,
    0,
  );
  const canManage = role === "owner" || role === "admin";

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  };

  const handleUpdate = async () => {
    setFormError("");
    const budget = Number(formData.budget_total);
    if (!formData.name.trim() || !formData.destination.trim()) {
      setFormError("Le titre et la destination sont requis.");
      return;
    }
    if (!Number.isFinite(budget) || budget < 0) {
      setFormError("Le budget est invalide.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const response = await fetch(apiUrl(`/api/trips/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, budget_total: budget }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Modification impossible");

      setFormData({
        name: result.name,
        destination: result.destination,
        cover_url: result.cover_url || "",
        start_date: result.start_date || "",
        end_date: result.end_date || "",
        budget_total: String(result.budget_total ?? 0),
      });
      toast.success("Voyage modifie");
      setEditOpen(false);
      onChanged?.();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Modification impossible");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const response = await fetch(apiUrl(`/api/trips/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Suppression impossible");

      toast.success("Voyage supprime");
      setDeleteOpen(false);
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <article
      onClick={() => router.push(`/dashboard/${id}`)}
      className="group flex h-full min-h-[365px] cursor-pointer flex-col overflow-hidden rounded-lg border border-[#ead9bf] bg-white shadow-[0_12px_30px_rgba(127,42,7,0.16)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d8aa86] hover:shadow-[0_22px_46px_rgba(127,42,7,0.24)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#f7e7dc]">
        <img
          src={image || DEFAULT_IMAGE}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
          }}
        />
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ring-1 shadow-sm ${statusStyle[status]}`}
        >
          {status}
        </span>
        {canManage && (
          <div
            className="absolute left-3 top-3 z-10"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-[#7f2a07] shadow-sm backdrop-blur transition hover:bg-white">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                <DropdownMenuItem
                  onClick={() => setEditOpen(true)}
                  className="text-[#7f2a07] focus:bg-[#f7e7dc] focus:text-[#7f2a07]"
                >
                  <Pencil />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-1 text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5 text-[#b2471d]" />
          {date}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#f0dfd2] pt-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
              <Users className="size-3.5" />
              {members.length} members
            </p>
          <TooltipProvider>
            <div className="flex items-center -space-x-2">
              {owner && <MemberAvatar member={owner} isOwner />}

              {visibleContributors.map((member) => (
                <MemberAvatar key={member.id} member={member} />
              ))}

              {extraCount > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9f411d] text-xs font-semibold text-white ring-2 ring-white">
                  +{extraCount}
                </div>
              )}
            </div>
          </TooltipProvider>
          </div>

          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            {role === "owner" && <InviteLinkBox tripId={id} />}
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#f7e7dc] text-[#9f411d] transition-colors group-hover:bg-[#9f411d] group-hover:text-white">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </article>

    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>Modifier le voyage</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor={`trip-name-${id}`}>Titre</Label>
            <Input
              id={`trip-name-${id}`}
              className="mt-1"
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`trip-destination-${id}`}>Destination</Label>
            <Input
              id={`trip-destination-${id}`}
              className="mt-1"
              value={formData.destination}
              onChange={(event) =>
                setFormData((current) => ({ ...current, destination: event.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor={`trip-start-${id}`}>Date de debut</Label>
            <Input
              id={`trip-start-${id}`}
              type="date"
              className="mt-1"
              value={formData.start_date}
              onChange={(event) =>
                setFormData((current) => ({ ...current, start_date: event.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor={`trip-end-${id}`}>Date de fin</Label>
            <Input
              id={`trip-end-${id}`}
              type="date"
              className="mt-1"
              value={formData.end_date}
              onChange={(event) =>
                setFormData((current) => ({ ...current, end_date: event.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`trip-budget-${id}`}>Budget total (DH)</Label>
            <Input
              id={`trip-budget-${id}`}
              type="number"
              min="0"
              className="mt-1"
              value={formData.budget_total}
              onChange={(event) =>
                setFormData((current) => ({ ...current, budget_total: event.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`trip-cover-${id}`}>Image URL</Label>
            <Input
              id={`trip-cover-${id}`}
              type="url"
              className="mt-1"
              value={formData.cover_url}
              onChange={(event) =>
                setFormData((current) => ({ ...current, cover_url: event.target.value }))
              }
            />
          </div>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-[#9f411d] text-white hover:bg-[#7f2a07]"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>Supprimer ce voyage ?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Cette action supprimera le voyage « {title} » et ne peut pas etre annulee.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            <Trash2 className="size-4" />
            {saving ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
