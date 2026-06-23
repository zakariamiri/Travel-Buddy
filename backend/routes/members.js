const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const membersController = require("../controllers/membersController");

router.get("/trips/:id/invite-code", requireAuth, membersController.getInviteCode);
router.post("/members/join", requireAuth, membersController.joinTrip);
router.get("/trips/:id/members", requireAuth, membersController.getMembers);
router.delete("/trips/:id/members/me", requireAuth, membersController.leaveTrip);

module.exports = router;
