import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import md5 from "md5";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

function TopbarContent() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const handleSearch = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.replace(`?${params.toString()}`);
  };

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

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#ead9bf] bg-white/90 px-4 shadow-sm backdrop-blur md:px-6">
      <div className="flex w-full items-center gap-4 md:max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9f411d]" />
          <Input
            placeholder="Search destinations..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 rounded-lg border-[#ead9bf] bg-[#fff8ec] pl-9 text-sm shadow-none focus-visible:ring-[#c9603a]/30"
          />
        </div>
      </div>

      <div className="ml-4 flex items-center gap-3">
        <div className="relative flex size-10 cursor-pointer items-center justify-center rounded-lg border border-[#ead9bf] bg-white text-gray-600 transition hover:bg-sidebar hover:text-[#9f411d]">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2.5 rounded-full bg-primary ring-2 ring-white" />
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-[#ead9bf] bg-white px-2.5 py-1.5 shadow-sm">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-800">{name}</p>
            <p className="text-xs text-muted-foreground">Traveler</p>
          </div>
          <Avatar className="size-9 ring-2 ring-[#f3e4da]">
            <AvatarImage src={avatar} />
            <AvatarFallback>{name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

export default function Topbar() {
  return (
    <Suspense fallback={null}>
      <TopbarContent />
    </Suspense>
  );
}
