"use client";

import InviteLinkBox from "@/components/InviteLinkBox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiUrl } from "@/lib/api";
import { createClient } from "@/utils/supabase/client";
import { Crown } from "lucide-react";
import md5 from "md5";
import { useEffect, useMemo, useState } from "react";

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
  status: "CONFIRMED" | "PLANNING" | "PAST";
  role?: string;
  members?: PartialTripMember[];
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
  status,
  role,
  members: initialMembers = [],
}: TripCardProps) {
  const supabase = useMemo(() => createClient(), []);
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
    CONFIRMED: "bg-green-100 text-green-700",
    PLANNING: "bg-orange-100 text-orange-700",
    PAST: "bg-gray-200 text-gray-700",
  };

  const owner = members.find((member) => member.role === "owner");
  const contributors = members.filter((member) => member.role !== "owner");
  const visibleContributors = contributors.slice(0, owner ? 3 : 4);
  const extraCount = Math.max(
    members.length - (owner ? 1 : 0) - visibleContributors.length,
    0,
  );

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition overflow-hidden cursor-pointer h-90">
      <div className="relative">
        <img
          src={image || DEFAULT_IMAGE}
          alt={title}
          className="h-44 w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
          }}
        />
        <span
          className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full shadow ${statusStyle[status]}`}
        >
          {status}
        </span>
      </div>

      <div className="p-4 relative">
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{date}</p>

        <button className="absolute top-3 right-3 backdrop-blur p-1.5 ">
          <i className="ri-more-2-fill text-gray-600 text-lg"></i>
        </button>

        <div className="flex items-center justify-between mt-13 gap-3">
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

          {role === "owner" && <InviteLinkBox tripId={id} />}
        </div>
      </div>
    </div>
  );
}
