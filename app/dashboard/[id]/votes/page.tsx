'use client'

import ActivityVoteCard from "@/components/ActivityVoteCard";
import { useTripContext } from "@/components/TripProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock3, ThumbsUp, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";


export default function Votespage() {
    const params = useParams();
    const tripId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
    const router = useRouter()

    const {
        activities,
        tripDetails
    } = useTripContext();

    const filters = [
        { value: "All", label: "All", icon: ThumbsUp, count: activities.length },
        { value: "pending", label: "Pending", icon: Clock3, count: activities.filter((activity) => activity.status === "pending").length },
        { value: "approved", label: "Approved", icon: CheckCircle2, count: activities.filter((activity) => activity.status === "approved").length },
        { value: "rejected", label: "Rejected", icon: XCircle, count: activities.filter((activity) => activity.status === "rejected").length },
    ];

    const getFilteredActivities = (filter: string) => {
        if (filter === "All") return activities;
        return activities.filter((activity) => activity.status === filter);
    };

    return (
        <main className="flex-1 overflow-y-auto bg-background">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 md:p-8">
                <header className="flex flex-col justify-between gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-xs font-semibold text-primary">
                            <ThumbsUp className="size-3.5" />
                            Activity Voting
                        </div>
                        <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
                            Vote on Activities
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            Choisissez les activites que vous voulez garder dans le voyage.
                        </p>
                    </div>
                    <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
                        <span className="text-muted-foreground">Trip members</span>
                        <p className="font-semibold text-foreground">{tripDetails?.membersCount ?? 0} participants</p>
                    </div>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-white p-5 shadow-sm">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ThumbsUp className="size-5" />
                        </div>
                        <p className="mt-5 text-sm font-medium text-muted-foreground">Total activities</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{activities.length}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-5 shadow-sm">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                            <CheckCircle2 className="size-5" />
                        </div>
                        <p className="mt-5 text-sm font-medium text-muted-foreground">Approved</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{filters[2].count}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-5 shadow-sm">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-accent/20 text-[#9f411d]">
                            <Clock3 className="size-5" />
                        </div>
                        <p className="mt-5 text-sm font-medium text-muted-foreground">Waiting votes</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{filters[1].count}</p>
                    </div>
                </section>

                <Tabs defaultValue="All" className="w-full">
                    <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg bg-sidebar p-1 text-foreground md:w-fit">
                        {filters.map((filter) => {
                            const Icon = filter.icon;
                            return (
                                <TabsTrigger
                                    key={filter.value}
                                    value={filter.value}
                                    className="min-w-fit gap-2 rounded-md px-3 py-2 data-active:bg-primary data-active:text-white hover:bg-primary hover:text-white"
                                >
                                    <Icon className="size-4" />
                                    {filter.label}
                                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-primary">
                                        {filter.count}
                                    </span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {filters.map((filter) => {
                        const filteredActivities = getFilteredActivities(filter.value);

                        return (
                            <TabsContent key={filter.value} value={filter.value} className="mt-6">
                                {filteredActivities.length === 0 ? (
                                    <div className="rounded-lg border border-dashed bg-white p-10 text-center shadow-sm">
                                        <p className="font-semibold text-foreground">No activities here</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Les activites apparaitront ici quand elles correspondent a ce statut.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                        {filteredActivities.map((activity) => (
                                            <ActivityVoteCard
                                                key={activity.id}
                                                activity={activity}
                                                tripId={tripId}
                                                membersCount={tripDetails?.membersCount ?? 0}
                                                onSuccess={() => router.refresh()} // Refresh parent data after voting
                                            />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </div>
        </main>
    )
}

