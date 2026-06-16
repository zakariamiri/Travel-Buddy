require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origine non autorisee par CORS"));
    },
  }),
);
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "JSON invalide" });
  }

  return next(err);
});
const tripsRoutes = require("./routes/trips");
const statsRoutes = require("./routes/stats");
const activitiesRoutes = require("./routes/activities");
const expensesRoutes = require("./routes/expenses");
const membersRoutes = require("./routes/members");

app.use("/api/stats", statsRoutes);
app.use("/api/trips", tripsRoutes);
app.use("/api", membersRoutes);
app.use("/api/trips/:tripId/activities", activitiesRoutes);
app.use("/api/trips/:tripId/expenses", expensesRoutes);
app.get("/", (req, res) => res.json({ status: " Travel Buddy API running" }));
app.use((req, res) => {
  res.status(404).json({ error: "Route API introuvable" });
});
app.use((err, req, res, next) => {
  void next;
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});
const server = app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Le port ${PORT} est deja utilise. Ferme l'ancien backend ou change PORT dans backend/.env.`,
    );
    process.exit(1);
  }

  console.error("Impossible de lancer le backend:", error);
  process.exit(1);
});
