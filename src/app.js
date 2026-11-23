const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  return res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "unavailable",
    service: "finished-goods-api",
    mongodb: connected ? "connected" : "disconnected",
    database: mongoose.connection.name || null,
  });
});

app.use("/api/auth", authRoutes);

app.use((req, res) => {
  return res.status(404).json({
    message: "Маршрут не знайдено",
  });
});

module.exports = app;
