const activityService = require('../services/activityService');

async function getActivitiesByTrip(req, res) {
    try {
        const activities = await activityService.getActivitiesByTrip(req.params.tripId);
        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }  
}

async function createActivity(req, res) {
    const { title, type, location, notes, image_url, scheduled_time, scheduled_date, position, status, lat, lon } = req.body;

    if (!title || !type) {
        return res.status(400).json({ error: "Title and type are required" });
    }
    
    if (!scheduled_date) {
        return res.status(400).json({ error: "Scheduled date is required" });
    }
    
    try {
        const activity = await activityService.createActivity(req.params.tripId, {
            title,
            type,
            location,
            notes,
            image_url,
            scheduled_time,
            scheduled_date,
            status: status || 'pending',
            lat,
            lon
        });
        res.status(201).json(activity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function updateActivity(req, res) {
    try{

        const {scheduled_time, scheduled_date } = req.body;
        res.json(await activityService.updateActivity(req.params.activityId, {
            scheduled_date
        }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
        
}

async function deleteActivity(req, res) {
    try {
        const activity = await activityService.deleteActivity(req.params.activityId);
        res.json(activity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getActivitiesByTrip,
    createActivity,
    deleteActivity,
    updateActivity
};