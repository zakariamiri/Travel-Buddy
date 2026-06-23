const membersService = require("../services/membersService");

async function getInviteCode(req, res) {
  try {
    const inviteCode = await membersService.getInviteCode(
      req.params.id,
      req.user.id,
    );

    res.json({ invite_code: inviteCode });
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Seul l'admin du voyage peut inviter" });
    }

    res.status(500).json({ error: err.message });
  }
}

async function joinTrip(req, res) {
  const { invite_code } = req.body;

  try {
    const trip = await membersService.joinTripByCode(invite_code, req.user.id);
    res.status(201).json({ success: true, trip });
  } catch (err) {
    if (err.message === "INVITE_CODE_REQUIRED") {
      return res.status(400).json({ error: "invite_code est requis" });
    }

    if (err.message === "INVALID_INVITE_CODE") {
      return res.status(404).json({ error: "Code d'invitation invalide" });
    }

    res.status(500).json({ error: err.message });
  }
}

async function getMembers(req, res) {
  try {
    const members = await membersService.getTripMembers(req.params.id);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function leaveTrip(req, res) {
  try {
    await membersService.leaveTrip(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message === "NOT_MEMBER") {
      return res.status(404).json({ error: "Vous n'etes pas membre de ce voyage" });
    }

    if (err.message === "OWNER_CANNOT_LEAVE") {
      return res.status(400).json({ error: "Le owner ne peut pas quitter son propre voyage" });
    }

    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getInviteCode,
  joinTrip,
  getMembers,
  leaveTrip,
};
