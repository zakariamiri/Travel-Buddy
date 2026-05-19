require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
const tripsRoutes = require("./routes/trips");
const statsRoutes = require("./routes/stats");
const activitiesRoutes = require("./routes/activities");
const expensesRoutes = require("./routes/expenses");
app.use("/api/stats", statsRoutes);
app.use("/api/trips", tripsRoutes);
app.use("/api/trips/:tripId/activities", activitiesRoutes);
app.use("/api/trips/:tripId/expenses", expensesRoutes);
app.get("/", (req, res) => res.json({ status: " Travel Buddy API running" }));
app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`),
);
