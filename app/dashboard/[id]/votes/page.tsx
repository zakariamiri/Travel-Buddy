'use client'

import ActivityVoteCard from "@/components/ActivityVoteCard";
import { useTripContext } from "@/components/TripProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";


export default function Votespage() {
    const params = useParams();
    const tripId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

    const {
        activities,
        tripDetails
    } = useTripContext();
    

    return (
        <main className="flex-1 overflow-y-auto p-10">
            <h1 className="font-bold text-3xl">Vote on Activities</h1>
            <p className="font-light text-muted-foreground">Cast your votes for the activities you'd like to participate in!</p>
            <Tabs defaultValue="All" className="w-[400px]">
                <TabsList className="bg-sidebar/50 text-foreground rounded-lg mt-5">
                    <TabsTrigger value="All" className="data-active:bg-primary data-active:text-primary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="data-active:bg-primary data-active:text-primary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                        Pending
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="data-active:bg-primary data-active:text-primary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                        Approved
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="data-active:bg-primary data-active:text-primary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                        Rejected
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="All">View all activities.</TabsContent>
                <TabsContent value="pending">View pending activities.</TabsContent>
                <TabsContent value="approved">View approved activities.</TabsContent>
                <TabsContent value="rejected">View rejected activities.</TabsContent>
            </Tabs>
            {activities.length === 0 ? (
                <p className="text-center text-muted-foreground mt-10">No activities available for voting.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                    {activities.map((activity) => (
                        <ActivityVoteCard key={activity.id} activity={activity} tripId={tripId} membersCount={tripDetails?.membersCount ?? 0} />
                    ))}

                </div>
            )}
        </main>
    )
}

