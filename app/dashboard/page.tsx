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

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();

            const fullName =
                data.user?.user_metadata?.full_name ||
                data.user?.email?.split("@")[0];

            setName(fullName);
        };

        getUser();
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();

            if (!data.user) {
                router.push("/login");
            }
        };

        checkUser();
    }, []);

    const trips = [
        {
            title: "Grecian Escape",
            date: "Jun 2 – Jun 24, 2024",
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
            status: "CONFIRMED",
        },
        {
            title: "Sydney Winter",
            date: "Aug 1 – Aug 15, 2024",
            image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03",
            status: "PLANNING",
        },
        {
            title: "Kyoto Blossoms",
            date: "Mar 22 – Apr 04, 2024",
            image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
            status: "PAST",
        },
        {
            title: "Kyoto Blossoms",
            date: "Mar 22 – Apr 04, 2024",
            image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
            status: "PAST",
        },
    ] as const;

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
                        Where next? Your collaborative itineraries are ready for the next adventure.
                    </p>

                    <Dialog>
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
                                    <Input placeholder="e.g. Paris Adventure" />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Destination
                                    </label>
                                    <Input placeholder="e.g. Paris, France" />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Cover Image URL
                                    </label>
                                    <Input placeholder="https://image-url.com" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Start Date
                                        </label>
                                        <Input type="date" />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            End Date
                                        </label>
                                        <Input type="date" />
                                    </div>
                                </div>

                                <Button className="bg-[#9f411d] hover:bg-[#8a3412] text-white rounded-xl mt-2 py-5">
                                    Create Trip
                                </Button>

                            </div>
                        </DialogContent>
                    </Dialog>

                    <StatsCards />

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-black">
                            My Trips
                        </h2>

                        <div className="bg-[#f3e4da] p-1 rounded-xl flex gap-1 shadow-inner">
                            <button className="px-4 py-1.5 text-sm font-semibold bg-[#9f411d] rounded-lg shadow text-white">
                                All </button>
                            <button className="px-4 py-1.5 text-sm text-gray-500 hover:text-[#7F2A07] rounded-lg transition">
                                Upcoming </button>
                            <button className="px-4 py-1.5 text-sm text-gray-500 hover:text-[#7F2A07] rounded-lg transition">
                                Past </button> </div>
                    </div>


                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {trips.map((trip, index) => (
                            <TripCard key={index} {...trip} />
                        ))}
                    </div>

                </main>
            </div>
        </div>
    );
}