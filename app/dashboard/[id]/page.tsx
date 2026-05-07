'use client'
import React, { useEffect, useState } from 'react'
import Topbar from "@/components/Topbar"
import TripSidebar from '@/components/TripSidebar'
import { Button } from '@/components/ui/button';
import ActivityCard from '@/components/activityCard';
import AddActivityModal from '@/components/AddActivityModal';
import { IoFilter } from "react-icons/io5";
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Trip from '@/types/types';
import { SidebarProvider } from "@/components/ui/sidebar"
import { toast } from "sonner"
import { DndContext, DragEndEvent, useSensor,
  useSensors,
  PointerSensor,
  TouchSensor, } from '@dnd-kit/core';
import DayColumn from '@/components/DayColumn';


export default function ActivitiesPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
    const [tripDetails, setTripDetails] = useState<Trip | null>(null);
    const [currentToken, setCurrentToken] = useState<string | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,      
      tolerance: 5,   
    },
  })
);

    useEffect(() => {
        const getToken = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentToken(session?.access_token || null);
        };
        getToken();
    }, []);

    useEffect(() => {
        // Fetch trip details using the ID
        const fetchTripDetails = async () => {
            try {
                const res = await fetch(`http://localhost:3001/api/trips/${id}`,
                    { headers: { Authorization: `Bearer ${currentToken}` } },

                );
                const trip = await res.json();
                console.log("Trip Details:", trip);
                setTripDetails(trip);
            } catch (err) {
                console.error("Error fetching trip details:", err);
            }
        };

        if (id && currentToken) {
            fetchTripDetails();
        }
    }, [id, currentToken]);

    const handleDelete = async (activityId: string) => {
        try {
            setActivities(prev => prev.filter(activity => activity.id !== activityId))

            const response = await fetch(`http://localhost:3001/api/trips/${id}/activities/${activityId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            })
            if (!response.ok) {
                throw new Error('Failed to delete activity')
            }
            toast.success('Activity deleted successfully')
        } catch (error) {
            console.error('Error deleting activity:', error)
            toast.error('Failed to delete activity')
        }
    }
    useEffect(() => {
        // Fetch activities for the trip
        const fetchActivities = async () => {
            if (!id || !currentToken) return;
            setLoadingActivities(true);
            try {
                const res = await fetch(`http://localhost:3001/api/trips/${id}/activities`,
                    { headers: { Authorization: `Bearer ${currentToken}` } }
                );
                const data = await res.json();
                console.log("Activities:", data);
                // Handle both array and object responses
                const activitiesArray = Array.isArray(data) ? data : (data?.activities || data?.data || []);
                setActivities(activitiesArray);
            } catch (err) {
                console.error("Error fetching activities:", err);
                setActivities([]);
            } finally {
                setLoadingActivities(false);
            }
        };

        if (id && currentToken) {
            fetchActivities();
        }
    }, [id, currentToken]);

    console.log("Activities:", activities);

    const days = tripDetails ? Math.ceil((new Date(tripDetails.end_date).getTime() - new Date(tripDetails.start_date).getTime()) / (1000 * 3600 * 24)) + 1 : 0;

    const getDateFromIndex = (startDate: string, index: number) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);
        return date;
    }

    console.log("Number of days in trip:", days);

    // Get activities for a specific day
    const getActivitiesForDay = (dayIndex: number) => {
        if (!tripDetails || !Array.isArray(activities)) return [];
        const dayDate = new Date(tripDetails.start_date);
        dayDate.setDate(dayDate.getDate() + dayIndex);
        const dayDateString = dayDate.toISOString().split('T')[0];

        return activities.filter(activity => activity.scheduled_date === dayDateString);
    };

    // Refresh activities when a new one is added
    const handleActivitySuccess = () => {
        if (id && currentToken) {
            // Re-fetch activities
            fetch(`http://localhost:3001/api/trips/${id}/activities`,
                { headers: { Authorization: `Bearer ${currentToken}` } }
            )
                .then(res => res.json())
                .then(data => {
                    // Handle both array and object responses
                    const activitiesArray = Array.isArray(data) ? data : (data?.activities || data?.data || []);
                    setActivities(activitiesArray);
                })
                .catch(err => {
                    console.error("Error refetching activities:", err);
                    setActivities([]);
                });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return; // Dropped outside

        const activityId = active.id as string;
        const targetDate = over.id as string;
        const draggedActivity = activities.find(a => a.id === activityId);

        if (draggedActivity && draggedActivity.scheduled_date !== targetDate) {
            // Optimistically update the UI
            setActivities(prev => prev.map(a => 
                a.id === activityId ? { ...a, scheduled_date: targetDate } : a
            ));

            try {
                const response = await fetch(`http://localhost:3001/api/trips/${id}/activities/${activityId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({ scheduled_date: targetDate })
                });

                if (!response.ok) {
                    throw new Error('Failed to update activity date');
                }
                toast.success('Activity moved successfully');
            } catch (error) {
                console.error('Error updating activity date:', error);
                toast.error('Failed to move activity');
                // Revert fetch on failure
                handleActivitySuccess();
            }
        }
    };

    return (
        <SidebarProvider>
            <DndContext onDragEnd={handleDragEnd} sensors={sensors}>

                <div className='flex flex-1 overflow-hidden'>
                    <TripSidebar tripDetails={tripDetails} />
                    <div className='flex-1 flex flex-col overflow-hidden'>
                        <div className='sticky top-0 z-20 bg-background'>
                            <Topbar />
                        </div>
                        <main className='flex-1 overflow-y-auto'>
                            <div className='sticky top-0 z-10 p-5 '>
                                <div className='flex justify-between items-center'>
                                    <h1 className='text-lg text-foreground'>Itinerary Timeline</h1>
                                    <div className='space-x-4 flex items-center'>
                                        <Button variant="outline" className='rounded-lg font-bold'><IoFilter />Filter</Button>

                                    </div>
                                </div>
                            </div>
                            
                            <div className='overflow-x-auto p-5 touch-pan-x'>
                                <div className='flex flex-nowrap gap-4 pb-4'>
                                    {days > 0 ? (
                                        Array.from({ length: days }, (_, i) => {
                                            const dayActivities = getActivitiesForDay(i);
                                            const dayDate = new Date(tripDetails?.start_date || '');
                                            dayDate.setDate(dayDate.getDate() + i);
                                            const dayDateString = dayDate.toISOString().split('T')[0];

                                            return (
                                                <DayColumn 
                                                    key={i} 
                                                    id={dayDateString}
                                                    title={`Day ${i + 1}`}
                                                    subtitle={getDateFromIndex(tripDetails?.start_date || '', i).toLocaleString('en-US', { month: 'long', day: 'numeric' })}
                                                    modalTrigger={
                                                        <AddActivityModal
                                                            tripId={id}
                                                            tripStartDate={dayDateString}
                                                            tripEndDate={tripDetails?.end_date}
                                                            trigger={
                                                                <button className='mt-3 w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors'>
                                                                    <span className='text-3xl font-bold'>+</span>
                                                                    <span className='text-sm font-semibold'>Add Activity</span>
                                                                </button>
                                                            }
                                                            onSuccess={handleActivitySuccess}
                                                        />
                                                    }
                                                >
                                                    {dayActivities.map((activity) => (
                                                        <ActivityCard
                                                            key={activity.id}
                                                            activity={activity}
                                                            onDelete={() => handleDelete(activity.id)}
                                                        />
                                                    ))}
                                                </DayColumn>
                                            );
                                        })
                                    ) : (
                                        <p className='text-gray-500 mt-4'>No trip details available to calculate itinerary.</p>
                                    )
                                    }
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </DndContext>

        </SidebarProvider>
    )
}

