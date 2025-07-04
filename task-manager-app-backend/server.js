// server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// === DATABASE CONNECTION ===
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// === ROUTES ===
app.get("/", (req, res) => {
  res.send("🚀 Task Manager API is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// === 404 HANDLER FOR INVALID ROUTES ===
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🔊 Server running on http://localhost:${PORT}`);
});
