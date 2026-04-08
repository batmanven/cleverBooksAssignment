const express = require("express");
const cors = require("cors");
const config = require("./config/env");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const settlementRoutes = require("./routes/settlements");
const jobRoutes = require("./routes/jobs");
const notificationRoutes = require("./routes/notifications");
const orderRoutes = require("./routes/orders");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
});

app.use("/api/settlements", settlementRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`\nServer running on http://localhost:${config.port}`);
    });

    try {
      const { startWorker } = require("./queues/notificationWorker");
      startWorker();
    } catch (err) {
      console.warn(
        `Notification worker failed to start (Redis may not be running): ${err.message}`,
      );
      console.warn(
        "The server will still work, but notifications will be queued and not processed.",
      );
    }

    const { startScheduler } = require("./schedulers/reconciliationScheduler");
    startScheduler();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  console.log("\nSIGTERM received. Shutting down gracefully...");
  try {
    const { stopWorker } = require("./queues/notificationWorker");
    const { stopScheduler } = require("./schedulers/reconciliationScheduler");
    await stopWorker();
    stopScheduler();
  } catch (e) {}
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\nSIGINT received. Shutting down gracefully...");
  try {
    const { stopWorker } = require("./queues/notificationWorker");
    const { stopScheduler } = require("./schedulers/reconciliationScheduler");
    await stopWorker();
    stopScheduler();
  } catch (e) {}
  process.exit(0);
});

startServer();

module.exports = app;
