import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">

      {/* SEARCH */}
      <div className="relative w-1/2">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search destinations..."
          className="pl-9 bg-gray-100 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-5">

        {/* NOTIFICATION */}
        <div className="relative cursor-pointer">
          <Bell className="w-5 h-5 text-gray-600 hover:text-black transition" />

          {/* red dot */}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </div>

        {/* USER */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 font-medium">Zakaria</span>

          <Avatar className="ring-2 ring-gray-100">
            <AvatarImage src="https://i.pravatar.cc/40" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>

      </div>
    </header>
  );
}