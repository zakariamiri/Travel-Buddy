const express = require("express");
const router = express.Router({mergeParams: true});
const requireAuth = require("../middleware/auth");
const activityController = require("../controllers/activityController");

router.get("/", requireAuth, activityController.getActivitiesByTrip);
router.post("/", requireAuth, activityController.createActivity);
router.delete("/:activityId", requireAuth, activityController.deleteActivity);
router.put("/:activityId", requireAuth, activityController.updateActivity);

module.exports = router;
