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
    const { title, type, location, notes, image_url, scheduled_time, scheduled_date, status, price_per_person, lat, lon } = req.body;

    if (!title || !type) {
        return res.status(400).json({ error: "Title and type are required" });
    }
    
    if (!scheduled_date) {
        return res.status(400).json({ error: "Scheduled date is required" });
    }
    
    try {
        const activity = await activityService.createActivity(req.params.tripId, req.user.id, {
            title,
            type,
            location,
            notes,
            image_url,
            scheduled_time,
            scheduled_date,
            status: status || 'pending',
            price_per_person,
            lat,
            lon
        });
        res.status(201).json(activity);
    } catch (err) {
        if (err.message === "FORBIDDEN") {
            return res.status(403).json({ error: "Seul le owner peut créer une activité" });
        }
        res.status(500).json({ error: err.message });
    }
}

async function updateActivity(req, res) {
    try{

        const { scheduled_date,title,
            type,
    location,
    notes,
    image_url,
    scheduled_time,
    price_per_person, } = req.body;
        res.json(await activityService.updateActivity(req.params.tripId, req.params.activityId, req.user.id, {
            scheduled_date,
            type,
            title,
            location,
            notes,
            image_url,
            scheduled_time,
            price_per_person
        }));
    } catch (err) {
        if (err.message === "FORBIDDEN") {
            return res.status(403).json({ error: "Seul le owner peut modifier une activité" });
        }
        res.status(500).json({ error: err.message });
    }
        
}

async function deleteActivity(req, res) {
    try {
        const activity = await activityService.deleteActivity(req.params.tripId, req.params.activityId, req.user.id);
        res.json(activity);
    } catch (err) {
        if (err.message === "FORBIDDEN") {
            return res.status(403).json({ error: "Seul le owner peut supprimer une activité" });
        }
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

      const result = await activityService.castVote(
          activityId,
          userId,
          voteValue,
      );
      res.status(200).json(result);
  } catch (error) {
      console.error('voteActivity error:', error);
      if (error?.message === "FORBIDDEN") {
          return res.status(403).json({ error: "Vous n'etes pas membre de ce voyage" });
      }
      if (error?.message === "ACTIVITY_NOT_FOUND") {
          return res.status(404).json({ error: "Activite introuvable" });
      }
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
