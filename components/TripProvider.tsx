'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Trip from '@/types/types';
import { toast } from "sonner";
import { useParams } from 'next/navigation';
import { DragEndEvent } from '@dnd-kit/core';
import { apiUrl } from '@/lib/api';

interface TripContextType {
    tripDetails: Trip | null;
    activities: any[];
    loadingActivities: boolean;
    currentToken: string | null;
    handleDelete: (activityId: string) => Promise<void>;
    handleActivitySuccess: () => void;
    handleDragEnd: (event: DragEndEvent) => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
    const [tripDetails, setTripDetails] = useState<Trip | null>(null);
    const [currentToken, setCurrentToken] = useState<string | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);

    useEffect(() => {
        const getToken = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentToken(session?.access_token || null);
        };
        getToken();
    }, []);

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                const res = await fetch(apiUrl(`/api/trips/${id}`),
                    { headers: { Authorization: `Bearer ${currentToken}` } }
                );
                const trip = await res.json();
                setTripDetails(trip);
            } catch (err) {
                console.error("Error fetching trip details:", err);
            }
        };

        if (id && currentToken) {
            fetchTripDetails();
        }
    }, [id, currentToken]);

    const fetchActivities = async () => {
        if (!id || !currentToken) return;
        setLoadingActivities(true);
        try {
            const res = await fetch(apiUrl(`/api/trips/${id}/activities`),
                { headers: { Authorization: `Bearer ${currentToken}` } }
            );
            const data = await res.json();
            const activitiesArray = Array.isArray(data) ? data : (data?.activities || data?.data || []);
            setActivities(activitiesArray);
        } catch (err) {
            console.error("Error fetching activities:", err);
            setActivities([]);
        } finally {
            setLoadingActivities(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [id, currentToken,activities]);

    const handleDelete = async (activityId: string) => {
        try {
            setActivities(prev => prev.filter(activity => activity.id !== activityId))
            const response = await fetch(apiUrl(`/api/trips/${id}/activities/${activityId}`), {
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

    const handleActivitySuccess = () => {
        fetchActivities();
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const activityId = active.id as string;
        const targetDate = over.id as string;
        const draggedActivity = activities.find(a => a.id === activityId);

        if (draggedActivity && draggedActivity.scheduled_date !== targetDate) {
            setActivities(prev => prev.map(a => 
                a.id === activityId ? { ...a, scheduled_date: targetDate } : a
            ));
            try {
                const response = await fetch(apiUrl(`/api/trips/${id}/activities/${activityId}`), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({ scheduled_date: targetDate })
                });

                if (!response.ok) throw new Error('Failed to update activity date');
                toast.success('Activity moved successfully');
            } catch (error) {
                console.error('Error updating activity date:', error);
                toast.error('Failed to move activity');
                handleActivitySuccess();
            }
        }
    };

    return (
        <TripContext.Provider value={{
            tripDetails,
            activities,
            loadingActivities,
            currentToken,
            handleDelete,
            handleActivitySuccess,
            handleDragEnd
        }}>
            {children}
        </TripContext.Provider>
    );
}

export const useTripContext = () => {
    const context = useContext(TripContext);
    if (!context) {
        throw new Error('useTripContext must be used within a TripProvider');
    }
    return context;
};
