'use client'
import React from 'react'
import Topbar from "@/components/Topbar";
import TripSidebar from '@/components/TripSidebar';
import { Button } from '@/components/ui/button';


export default function ActivitiesPage() {
    return (
        <div className='flex min-h-screen'>
            <TripSidebar />
            <div className='flex-1 flex-col'>

                <Topbar />
            <main className='p-5'>
                <div className='flex justify-between items-center'>
                <h1 className='text-lg text-foreground'>Itinerary Timeline</h1>
                <Button variant="outline" className='mt-3 bg-primary text-white hover:bg-primary/90 font-bold'>+ Add Activity</Button>
                </div>
            </main>
            </div>
        </div>
    )
}

