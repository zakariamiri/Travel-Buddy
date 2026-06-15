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

async function getTripById(req, res) {
  try {
    const trip = await tripsService.getTripById(req.params.id, req.user.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createTrip(req, res) {
  const {
    name,
    destination,
    cover_url,
    start_date,
    end_date,
    budget_total,
  } = req.body;

  if (!name || !destination) {
    return res.status(400).json({ error: "name et destination sont requis" });
  }

  const budgetTotal = Number(budget_total);
  if (!Number.isFinite(budgetTotal) || budgetTotal < 0) {
    return res.status(400).json({ error: "Le budget doit etre un montant valide" });
  }

  try {
    const trip = await tripsService.createTrip(req.user.id, {
      name,
      destination,
      cover_url,
      start_date,
      end_date,
      budget_total: budgetTotal,
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

async function updateTripBudget(req, res) {
  const budgetTotal = Number(req.body.budget_total);

  if (!Number.isFinite(budgetTotal) || budgetTotal < 0) {
    return res.status(400).json({ error: "Le budget doit etre un montant positif" });
  }

  try {
    const trip = await tripsService.updateTripBudget(
      req.user.id,
      req.params.id,
      budgetTotal,
    );
    res.json(trip);
  } catch (err) {
    if (err.message === "FORBIDDEN" || err.message === "OWNER_REQUIRED") {
      return res.status(403).json({ error: "Seul l'admin peut modifier le budget" });
    }
    res.status(500).json({ error: err.message });
  }
}

async function updateTrip(req, res) {
  const {
    name,
    destination,
    cover_url,
    start_date,
    end_date,
    budget_total,
  } = req.body;
  const budgetTotal = Number(budget_total);

  if (!name?.trim() || !destination?.trim()) {
    return res.status(400).json({ error: "Le titre et la destination sont requis" });
  }
  if (!Number.isFinite(budgetTotal) || budgetTotal < 0) {
    return res.status(400).json({ error: "Le budget doit etre un montant valide" });
  }
  if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ error: "La date de fin doit suivre la date de debut" });
  }

  try {
    const trip = await tripsService.updateTrip(req.user.id, req.params.id, {
      name: name.trim(),
      destination: destination.trim(),
      cover_url,
      start_date,
      end_date,
      budget_total: budgetTotal,
    });
    res.json(trip);
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Seul l'admin peut modifier ce voyage" });
    }
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getTrips,
  createTrip,
  deleteTrip,
  getTripById,
  updateTripBudget,
  updateTrip,
};
