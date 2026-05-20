const express = require("express");
const router = express.Router({mergeParams: true});
const requireAuth = require("../middleware/auth");
const tripsController = require("../controllers/tripsController");
const membersController = require("../controllers/membersController");

router.get("/", requireAuth, tripsController.getTrips);
router.get("/:id/invite-code", requireAuth, membersController.getInviteCode);
router.get("/:id/members", requireAuth, membersController.getMembers);
router.get("/:id", requireAuth, tripsController.getTripById);
router.post("/", requireAuth, tripsController.createTrip);
router.delete("/:id", requireAuth, tripsController.deleteTrip);
module.exports = router;
