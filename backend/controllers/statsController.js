const statsService = require("../services/statsService");

async function getStats(req, res) {
  try {
    const stats = await statsService.getStats(req.user.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getStats };
