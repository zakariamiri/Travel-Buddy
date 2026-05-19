'use client'
import React from 'react'
import { Button } from '@/components/ui/button';
import ActivityCard from '@/components/activityCard';
import AddActivityModal from '@/components/AddActivityModal';
import { IoFilter } from "react-icons/io5";
import { useParams } from 'next/navigation';
import { DndContext, useSensor,
  useSensors,
  PointerSensor,
  TouchSensor, } from '@dnd-kit/core';
import DayColumn from '@/components/DayColumn';
import { useTripContext } from '@/components/TripProvider';

export default function ActivitiesPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
    const { 
        tripDetails, 
        activities, 
        handleDelete, 
        handleActivitySuccess, 
        handleDragEnd 
    } = useTripContext();

    const sensors = useSensors(
      useSensor(PointerSensor,{
        activationConstraint: {
          distance: 5, // Start dragging after moving 5 pixels
        },
      }),
      useSensor(TouchSensor, {
        activationConstraint: {
          delay: 150,      
          tolerance: 5,   
        },
      })
    );

    const days = tripDetails ? Math.ceil((new Date(tripDetails.end_date).getTime() - new Date(tripDetails.start_date).getTime()) / (1000 * 3600 * 24)) + 1 : 0;

    const getDateFromIndex = (startDate: string, index: number) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);
        return date;
    }

    // Get activities for a specific day
    const getActivitiesForDay = (dayIndex: number) => {
        if (!tripDetails || !Array.isArray(activities)) return [];
        const dayDate = new Date(tripDetails.start_date);
        dayDate.setDate(dayDate.getDate() + dayIndex);
        const dayDateString = dayDate.toISOString().split('T')[0];

        return activities.filter(activity => activity.scheduled_date === dayDateString && activity.status === "approved");
    };

    return (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
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
        </DndContext>
    )
}

