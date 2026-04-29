import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import md5 from "md5";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

type TripCardProps = {
  title: string;
  date: string;
  image: string;
  status: "CONFIRMED" | "PLANNING" | "PAST";
  members?: {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
  }[];
};

const DEFAULT_IMAGE = "https://www.gravatar.com/avatar/0?d=identicon";

const user = { user_metadata: { avatar_url: DEFAULT_IMAGE } };
const hash = "defaultHash";

export default function TripCard({
  title,
  date,
  image,
  status,
  members = [],
}: TripCardProps) {
  const supabase = createClient();
  const [name, setName] = useState("User");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      const fullName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0];

      setName(fullName || "User");

      const email = user?.email || "";
      const hash = md5(email.trim().toLowerCase());

      const avatarUrl =
        user?.user_metadata?.avatar_url ||
        `https://www.gravatar.com/avatar/${hash}?d=identicon`;

      setAvatar(avatarUrl);
    };

    getUser();
  }, []);

  const statusStyle = {
    CONFIRMED: "bg-green-100 text-green-700",
    PLANNING: "bg-orange-100 text-orange-700",
    PAST: "bg-gray-200 text-gray-700",
  };

  const sortedMembers = [
    ...members.filter((m) => m.role === "owner"), // ← owner en 1er
    ...members.filter((m) => m.role !== "owner"), // ← autres après
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition overflow-hidden cursor-pointer h-90">
      <div className="relative">
        <img
          src={image || DEFAULT_IMAGE}
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

        <div className="flex items-center justify-between mt-13">
          <div className="flex -space-x-2">
            {members.length > 0 ? (
              members.slice(0, 3).map((member, i) => (
                <div key={member.id || i} className="relative">
                  <Avatar className="ring-2 ring-gray-100">
                    <AvatarImage
                      src={
                        member.avatar_url ||
                        `https://i.pravatar.cc/40?img=${i + 1}`
                      }
                    />
                    <AvatarFallback>
                      {member.full_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {member.role === "owner" && (
                    <span className="absolute -top-1 -right-1 text-[8px]">
                      👑
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="relative">
                <Avatar className="ring-2 ring-gray-100">
                  <AvatarImage src={avatar} />
                  <AvatarFallback>
                    {name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -top-1 -right-1 text-[8px]">👑</span>
              </div>
            )}
          </div>

          <button className="text-[#9f411d]">
            <i className="ri-share-line text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
