const cron = require("node-cron");
const config = require("../config/env");

let scheduledTask = null;

/**
 * Starts the nightly reconciliation scheduler.
 * Default: 2:00 AM IST daily.
 */
function startScheduler() {
  const cronExpression = config.reconciliationCron;

  if (!cron.validate(cronExpression)) {
    console.error(`Invalid cron expression: ${cronExpression}`);
    return;
  }

  scheduledTask = cron.schedule(
    cronExpression,
    async () => {
      console.log(
        `\nScheduled reconciliation triggered at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`,
      );
      try {
        const {
          runReconciliation,
        } = require("../services/reconciliationService");
        await runReconciliation("CRON");
      } catch (error) {
        console.error("Scheduled reconciliation failed:", error.message);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    },
  );

  console.log(
    `Reconciliation scheduler started: "${cronExpression}" (Asia/Kolkata — IST)`,
  );
}

// sto stop the schedular!!
function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("Reconciliation scheduler stopped");
  }
}

module.exports = { startScheduler, stopScheduler };
