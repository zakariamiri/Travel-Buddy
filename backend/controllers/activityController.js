const activityService = require('../services/activityService');

async function getActivitiesByTrip(req, res) {
    try {
        const userId = req.user?.id;
        const activities = await activityService.getActivitiesByTrip(req.params.tripId, userId);
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

async function voteActivity(req, res) {
  try {
      const { activityId } = req.params;
      const { vote_value } = req.body; 
      const userId = req.user.id;

      const voteValue = Number(vote_value);
      if (!Number.isFinite(voteValue) || (voteValue !== 1 && voteValue !== -1)) {
          return res.status(400).json({ error: 'vote_value must be 1 or -1' });
      }

      const result = await activityService.castVote(activityId, userId, voteValue);
      res.status(200).json(result);
  } catch (error) {
      console.error('voteActivity error:', error);
      res.status(500).json({
          error: error?.message || 'Unknown error',
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
      });
  }
};
module.exports = {
    getActivitiesByTrip,
    createActivity,
    deleteActivity,
    updateActivity,
    voteActivity,
};