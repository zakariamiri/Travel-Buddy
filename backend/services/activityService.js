const supabase = require("../supabaseClient");

async function getActivitiesByTrip(tripId) {
    const { data: activities, error } = await supabase.from("trip_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });
    if (error) {
        console.error("Error fetching activities:", error);
        throw error;
    }
    return activities;
}

async function createActivity(tripId, { title, type, location, notes, image_url, scheduled_time, scheduled_date, position = 0, status = 'pending', lat, lon }) {
    const { data: activity, error } = await supabase.from("trip_items")
        .insert({
            trip_id: tripId,
            title,
            type,
            location,
            notes,
            image_url,
            scheduled_time,
            scheduled_date,
            position,
            status,
            lat,
            lon
        })
        .select()
        .single();
    if (error) {
        console.error("Error creating activity:", error);
        throw error;
    }
    return activity;
}

module.exports = {
    getActivitiesByTrip,
    createActivity
};