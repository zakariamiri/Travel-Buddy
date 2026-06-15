const supabase = require("../supabaseClient");



async function getMembersCount(tripId){
    const { count, error } = await supabase
        .from("trip_members")
        .select("*", { count: "exact", head: true })
        .eq("trip_id", tripId);
    if (error) {
        console.error("Error fetching members count:", error);
        throw error;
    }
    return count;
}

async function getActivitiesByTrip(tripId, userId) {
    const { data: activities, error } = await supabase.from("trip_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });
    if (error) {
        console.error("Error fetching activities:", error);
        throw error;
    }

    

    if (!activities?.length) return activities;

    // Enrich with votes (total votes + current user's vote)
    const activityIds = activities.map(a => a.id);
    const { data: votes, error: votesError } = await supabase
        .from('activity_votes')
        .select('activity_id,user_id,vote_value')
        .in('activity_id', activityIds);

    if (votesError) {
        console.error('Error fetching activity votes:', votesError);
        // Still return activities; votes are optional UI enrichment
        return activities;
    }

    const voteCountByActivityId = {};
    const userVoteByActivityId = {};

    for (const vote of votes || []) {
        voteCountByActivityId[vote.activity_id] = (voteCountByActivityId[vote.activity_id] || 0) + 1;
        if (userId && vote.user_id === userId) {
            userVoteByActivityId[vote.activity_id] = vote.vote_value;
        }
    }
    // activities.map(activity=>{
    //    if(voteCountByActivityId[activity.id] == getMembersCount(activity.trip_id)){
    //     await supabase.from("trip_items").update({status:"approved"}).eq("id",activity.id)
    //    }
    // })

    return activities.map(activity => ({
        ...activity,
        voteCount: voteCountByActivityId[activity.id] || 0,
        currentUserVote: userVoteByActivityId[activity.id] || 0,
    }));
}

async function createActivity(tripId, { title, type, location, notes, image_url, scheduled_time, scheduled_date,  status = 'pending', price_per_person, lat, lon }) {
    const payload = {
        trip_id: tripId,
        title,
        type,
        location,
        notes,
        image_url,
        scheduled_time,
        scheduled_date,
        status,
        price_per_person,
        lat,
        lon
    };

    const { data: activity, error } = await supabase.from("trip_items")
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error("Error creating activity:", error);
        throw error;
    }
    return activity;
}


async function updateActivity(activityId, { scheduled_date }) {
    const { data: activity, error } = await supabase.from("trip_items")
        .update({
    
            scheduled_date
        })
        .eq("id", activityId)
        .select()
        .single();
    if (error) {
        console.error("Error updating activity:", error);
        throw error;
    }
    return activity;
}

async function deleteActivity(activityId) {
    const { data: activity, error } = await supabase.from("trip_items")
        .delete()
        .eq("id", activityId)
        .select()
        .single();
    if (error) {
        console.error("Error deleting activity:", error);
        throw error;
    }
    return activity;
}
async function castVote(activityId, userId, voteValue) {
    // Get trip_id from the activity
    const { data: activity, error: activityError } = await supabase
        .from("trip_items")
        .select("trip_id")
        .eq("id", activityId)
        .single();

    if (activityError) throw activityError;
    if (!activity) throw new Error("ACTIVITY_NOT_FOUND");

    const tripId = activity.trip_id;

    // Verify user is a member of the trip
    const { data: membership, error: membershipError } = await supabase
        .from("trip_members")
        .select("user_id")
        .eq("trip_id", tripId)
        .eq("user_id", userId)
        .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) throw new Error("FORBIDDEN");

    const { error: voteError } = await supabase
        .from("activity_votes")
        .upsert(
            { activity_id: activityId, user_id: userId, vote_value: voteValue },
            { onConflict: "activity_id,user_id" }
        );

    if (voteError) throw voteError;

    const membersCount = await getMembersCount(tripId);

    const [{ count: likesCount }, { count: dislikesCount }] = await Promise.all([
        supabase
            .from("activity_votes")
            .select("*", { count: "exact", head: true })
            .eq("activity_id", activityId)
            .eq("vote_value", 1),

        supabase
            .from("activity_votes")
            .select("*", { count: "exact", head: true })
            .eq("activity_id", activityId)
            .eq("vote_value", -1),
    ]);

    let newStatus = 'pending';
    if (likesCount >= Math.ceil(membersCount / 2)) {
        newStatus = 'approved';
    } else if (dislikesCount >= Math.ceil(membersCount / 2)) {
        newStatus = 'rejected';
    }

    if (newStatus !== 'pending') {
        await supabase
            .from("trip_items")
            .update({ status: newStatus })
            .eq("id", activityId);
    }
}

module.exports = {
    getActivitiesByTrip,
    createActivity,
    deleteActivity,
    updateActivity, 
    castVote
};
