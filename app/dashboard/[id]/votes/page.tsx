'use client'

import ActivityVoteCard from "@/components/ActivityVoteCard";
import { useTripContext } from "@/components/TripProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock3, ThumbsUp, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";


export default function Votespage() {
    const { t } = useLanguage();
    const params = useParams();
    const tripId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

    const {
        activities,
        tripDetails,
        handleActivitySuccess
    } = useTripContext();

    const filters = [
        { value: "All", label: t("all"), icon: ThumbsUp, count: activities.length },
        { value: "pending", label: t("pending"), icon: Clock3, count: activities.filter((activity) => activity.status === "pending").length },
        { value: "approved", label: t("approved"), icon: CheckCircle2, count: activities.filter((activity) => activity.status === "approved").length },
        { value: "rejected", label: t("rejected"), icon: XCircle, count: activities.filter((activity) => activity.status === "rejected").length },
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
                            {t("activityVoting")}
                        </div>
                        <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
                            {t("voteOnActivities")}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            {t("voteText")}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
                        <span className="text-muted-foreground">{t("tripMembers")}</span>
                        <p className="font-semibold text-foreground">{tripDetails?.membersCount ?? 0} {t("participants")}</p>
                    </div>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-white p-5 shadow-[0_8px_24px_rgba(127,42,7,0.1)] transition-shadow hover:shadow-[0_12px_30px_rgba(127,42,7,0.15)]">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ThumbsUp className="size-5" />
                        </div>
                        <p className="mt-5 text-sm font-medium text-muted-foreground">{t("totalActivities")}</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{activities.length}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-5 shadow-[0_8px_24px_rgba(127,42,7,0.1)] transition-shadow hover:shadow-[0_12px_30px_rgba(127,42,7,0.15)]">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                            <CheckCircle2 className="size-5" />
                        </div>
                        <p className="mt-5 text-sm font-medium text-muted-foreground">{t("approved")}</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{filters[2].count}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-5 shadow-[0_8px_24px_rgba(127,42,7,0.1)] transition-shadow hover:shadow-[0_12px_30px_rgba(127,42,7,0.15)]">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-accent/20 text-[#9f411d]">
                            <Clock3 className="size-5" />
                        </div>
                        <p className="mt-5 text-sm font-medium text-muted-foreground">{t("waitingVotes")}</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{filters[1].count}</p>
                    </div>
                </section>

                <Tabs defaultValue="All" className="w-full">
                    <TabsList className="grid !h-auto w-full grid-cols-2 gap-1 overflow-hidden rounded-lg border border-[#e6d6c9] bg-white p-1 text-foreground shadow-[0_4px_14px_rgba(127,42,7,0.07)] sm:grid-cols-4 lg:w-fit">
                        {filters.map((filter) => {
                            const Icon = filter.icon;
                            return (
                                <TabsTrigger
                                    key={filter.value}
                                    value={filter.value}
                                    className="group !h-8 min-w-0 gap-1.5 rounded-md border-0 bg-transparent px-2.5 text-xs font-semibold text-[#745f55] shadow-none transition-all hover:bg-[#faf1ea] hover:text-[#9f411d] data-active:!bg-[#9f411d] data-active:!text-white data-active:shadow-[0_3px_9px_rgba(127,42,7,0.18)]"
                                >
                                    <Icon className="size-3.5" />
                                    <span className="truncate">{filter.label}</span>
                                    <span className="ml-auto min-w-4 rounded-full bg-[#f1e6de] px-1 py-0.5 text-center text-[10px] font-bold leading-none text-[#8a5b45] transition-colors group-data-active:bg-white/20 group-data-active:text-white">
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
                                    <div className="rounded-lg border border-dashed bg-white p-10 text-center shadow-[0_8px_24px_rgba(127,42,7,0.1)]">
                                        <p className="font-semibold text-foreground">{t("noActivitiesHere")}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {t("activitiesStatusHint")}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {filteredActivities.map((activity) => (
                                            <ActivityVoteCard
                                                key={activity.id}
                                                activity={activity}
                                                tripId={tripId}
                                                membersCount={tripDetails?.membersCount ?? 0}
                                                onSuccess={handleActivitySuccess}
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

