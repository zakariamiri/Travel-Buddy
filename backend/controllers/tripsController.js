const tripsService = require("../services/tripsService");
async function getTrips(req, res) {
  try {
    const trips = await tripsService.getTripsByUser(
      req.user.id,
      req.query.filter,
    );
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function createTrip(req, res) {
  const { name, destination, cover_url, start_date, end_date } = req.body;

  if (!name || !destination) {
    return res.status(400).json({ error: "name et destination sont requis" });
  }

  try {
    const trip = await tripsService.createTrip(req.user.id, {
      name,
      destination,
      cover_url,
      start_date,
      end_date,
    });
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function deleteTrip(req, res) {
  try {
    await tripsService.deleteTrip(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ error: "Seul le owner peut supprimer ce trip" });
    }
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getTrips, createTrip, deleteTrip };
