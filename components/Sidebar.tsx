import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Sidebar() {
    const supabase = createClient();
    const router = useRouter();
    const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    };
  return (
    <aside className="w-64 bg-[#FFEFD4] border-r flex flex-col p-4 gap-3 h-screen sticky top-0">
      <img src="/logo2.png" className="mb-8 mt-4 mr-2" />
        {/* Dashboard */}
        <Button
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
        >
        <i className="ri-home-5-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        Dashboard
        </Button>

        {/* Trips */}
        <Button
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
        >
        <i className="ri-flight-takeoff-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        Trips
        </Button>

        {/* Explore */}
        <Button
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
        >
        <i className="ri-map-2-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        Explore
        </Button>

        {/* Expenses */}
        <Button
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
        >
        <i className="ri-wallet-3-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        Expenses
        </Button>

        {/* Settings */}
        <Button
        variant="ghost"
        className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                    bg-transparent text-gray-800
                    transition-all duration-200
                    hover:bg-[#9f411d] hover:text-white"
        >
        <i className="ri-settings-3-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
        Settings
        </Button>

        <div className="mt-auto pt-4">

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="group justify-start gap-4 text-base rounded-md px-3 py-6 
                     bg-transparent text-gray-800
                     transition-all duration-200
                     hover:bg-[#9f411d] hover:text-white"
        >
          <i className="ri-logout-box-r-line text-xl text-gray-800 transition-colors group-hover:text-white"></i>
          Logout
        </Button>

      </div>
    </aside>
  );
}