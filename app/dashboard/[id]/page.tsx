'use client'
import React from 'react'
import { Button } from '@/components/ui/button';
import ActivityCard from '@/components/activityCard';
import AddActivityModal from '@/components/AddActivityModal';
import { IoFilter } from "react-icons/io5";
import { CalendarDays, MapPinned, Plus, Route } from 'lucide-react';
import { useParams } from 'next/navigation';
import { DndContext, useSensor,
  useSensors,
  PointerSensor,
  TouchSensor, } from '@dnd-kit/core';
import DayColumn from '@/components/DayColumn';
import { useTripContext } from '@/components/TripProvider';
import { useLanguage } from '@/components/LanguageProvider';

export default function ActivitiesPage() {
    const { t } = useLanguage();
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
    const { 
        tripDetails, 
        activities, 
        handleDelete, 
        handleActivitySuccess, 
        handleDragEnd,
        canManageTrip,
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
            <main className='flex-1 overflow-y-auto bg-background'>
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 md:p-8">
                    <header className="flex flex-col justify-between gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-xs font-semibold text-primary">
                                <Route className="size-3.5" />
                                {t("timeline")}
                            </div>
                            <h1 className='text-3xl font-bold tracking-normal text-foreground md:text-4xl'>{t("itineraryTimeline")}</h1>
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                {t("timelineText")}
                            </p>
                        </div>
                        <div className='flex items-center gap-3'>
                            <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
                                <span className="text-muted-foreground">{t("tripDuration")}</span>
                                <p className="font-semibold text-foreground">{days} {t("days")}</p>
                            </div>
                            <Button variant="outline" className='rounded-lg border-[#ead9bf] bg-white font-bold text-[#9f411d] hover:bg-sidebar'>
                                <IoFilter />
                                {t("filter")}
                            </Button>
                        </div>
                    </header>

                    <section className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border bg-white p-5 shadow-[0_8px_24px_rgba(127,42,7,0.1)] transition-shadow hover:shadow-[0_12px_30px_rgba(127,42,7,0.15)]">
                            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <CalendarDays className="size-5" />
                            </div>
                            <p className="mt-5 text-sm font-medium text-muted-foreground">{t("tripDays")}</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{days}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-5 shadow-[0_8px_24px_rgba(127,42,7,0.1)] transition-shadow hover:shadow-[0_12px_30px_rgba(127,42,7,0.15)]">
                            <div className="flex size-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                                <Route className="size-5" />
                            </div>
                            <p className="mt-5 text-sm font-medium text-muted-foreground">{t("approvedActivities")}</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">
                                {activities.filter((activity) => activity.status === "approved").length}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-white p-5 shadow-[0_8px_24px_rgba(127,42,7,0.1)] transition-shadow hover:shadow-[0_12px_30px_rgba(127,42,7,0.15)]">
                            <div className="flex size-11 items-center justify-center rounded-lg bg-accent/20 text-[#9f411d]">
                                <MapPinned className="size-5" />
                            </div>
                            <p className="mt-5 text-sm font-medium text-muted-foreground">{t("destination")}</p>
                            <p className="mt-1 line-clamp-1 text-2xl font-bold text-foreground">{tripDetails?.destination || '-'}</p>
                        </div>
                    </section>
                
                    <div className='overflow-x-auto touch-pan-x'>
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
                                        title={`${t("day")} ${i + 1}`}
                                        subtitle={getDateFromIndex(tripDetails?.start_date || '', i).toLocaleString('en-US', { month: 'long', day: 'numeric' })}
                                        modalTrigger={
                                            canManageTrip ? (
                                                <AddActivityModal
                                                    tripId={id}
                                                    tripStartDate={dayDateString}
                                                    tripEndDate={tripDetails?.end_date}
                                                    trigger={
                                                        <button className='mt-3 flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d8bda7] bg-[#fff8ec] text-[#9f411d] transition-colors hover:bg-sidebar'>
                                                            <Plus className="size-6" />
                                                            <span className='text-sm font-semibold'>{t("addActivity")}</span>
                                                        </button>
                                                    }
                                                    onSuccess={handleActivitySuccess}
                                                />
                                            ) : null
                                        }
                                    >
                                        {dayActivities.map((activity) => (
                                            <ActivityCard
                                                key={activity.id}
                                                activity={activity}
                                                onDelete={() => handleDelete(activity.id)}
                                                canEdit={canManageTrip}
                                            />
                                        ))}
                                    </DayColumn>
                                );
                            })
                        ) : (
                            <p className='text-gray-500 mt-4'>{t("noTripDetails")}</p>
                        )
                        }
                    </div>
                    </div>
                </div>
            </main>
        </DndContext>
    )
}

