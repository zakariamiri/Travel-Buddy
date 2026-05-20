'use client'
import React from 'react'
import Topbar from "@/components/Topbar"
import TripSidebar from '@/components/TripSidebar'
import { SidebarProvider } from "@/components/ui/sidebar"
import { TripProvider, useTripContext } from '@/components/TripProvider'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { tripDetails } = useTripContext();

    return (
        <SidebarProvider>
            <div className='flex flex-1 overflow-hidden h-[100dvh] w-full'>
                <TripSidebar tripDetails={tripDetails} />
                <div className='flex-1 flex flex-col overflow-hidden w-full'>
                    <div className='sticky top-0 z-20 bg-background'>
                        <Topbar />
                    </div>
                    {children}
                </div>
            </div>
        </SidebarProvider>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <TripProvider>
            <DashboardLayoutContent>
                {children}
            </DashboardLayoutContent>
        </TripProvider>
    )
}
