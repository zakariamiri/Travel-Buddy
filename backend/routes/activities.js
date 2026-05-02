const express = require("express");
const router = express.Router({mergeParams: true});
const requireAuth = require("../middleware/auth");
const activityController = require("../controllers/activityController");

router.get("/", requireAuth, activityController.getActivitiesByTrip);
router.post("/", requireAuth, activityController.createActivity);
module.exports = router;
