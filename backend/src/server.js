import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import batchRoutes from "./routes/batches.js";
import dashboardRoutes from "./routes/dashboard.js";
import explainRoutes from "./routes/explain.js";

const app = express();
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/batches", batchRoutes);
app.use("/batches", dashboardRoutes);
app.use("/batches", explainRoutes);

// Centralized error handler - catches anything thrown/rejected in a
// route that wasn't already turned into a clean response (e.g. an
// unexpected DB error), so the API never leaks a raw stack trace or
// hangs the request.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ detail: "Internal server error" });
});

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
