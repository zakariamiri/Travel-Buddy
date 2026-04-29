require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
const tripsRoutes = require("./routes/trips");
const statsRoutes = require("./routes/stats");
app.use("/api/stats", statsRoutes);
app.use("/api/trips", tripsRoutes);
app.get("/", (req, res) => res.json({ status: " Travel Buddy API running" }));
app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`),
);
