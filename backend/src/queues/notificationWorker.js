const { Worker } = require("bullmq");
const { getRedisConnection } = require("../config/redis");
const { QUEUE_NAME } = require("./discrepancyQueue");
const { sendWebhookNotification } = require("../services/notificationService");
const Notification = require("../models/Notification");

let worker = null;

/**
 *starts the BullMQ notification worker.
 *
 * This is the CONSUMER side — completely decoupled from the reconciliation engine.
 * It processes jobs from the discrepancy-notifications queue and sends webhook notifications.
 *
 * Features:
 * - Retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
 * - Dead-letter after max attempts
 * - Idempotency check before sending
 * - Notification record tracking in MongoDB
 */
function startWorker() {
  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const data = job.data;
      console.log(
        `\n🔔 Processing notification: ${data.discrepancyType} for ${data.awbNumber} (attempt ${job.attemptsMade + 1})`,
      );

      const existingNotification = await Notification.findOne({
        idempotencyKey: data.idempotencyKey,
        status: "SENT",
      });

      if (existingNotification) {
        console.log(`Skipping duplicate notification: ${data.idempotencyKey}`);
        return { skipped: true, reason: "already_sent" };
      }

      // Create or update notification record
      let notification = await Notification.findOne({
        idempotencyKey: data.idempotencyKey,
      });

      if (!notification) {
        notification = new Notification({
          settlementId: data.settlementId,
          awbNumber: data.awbNumber,
          merchantId: data.merchantId,
          discrepancyType: data.discrepancyType,
          expectedValue: data.expectedValue,
          actualValue: data.actualValue,
          suggestedAction: data.suggestedAction,
          idempotencyKey: data.idempotencyKey,
          reconciliationJobId: data.reconciliationJobId,
          status: "PENDING",
          attempts: 0,
        });
      }

      const result = await sendWebhookNotification(data);

      notification.attempts = job.attemptsMade + 1;
      notification.lastAttemptAt = new Date();

      if (result.success) {
        notification.status = "SENT";
        notification.webhookResponse = {
          statusCode: result.statusCode,
          body: result.body,
        };
        notification.error = null;
        await notification.save();

        console.log(
          `Notification sent: ${data.discrepancyType} for ${data.awbNumber}`,
        );
        return { sent: true, statusCode: result.statusCode };
      } else {
        notification.status = "FAILED";
        notification.webhookResponse = {
          statusCode: result.statusCode,
          body: result.body,
        };
        notification.error = result.body;

        const nextDelay = Math.pow(2, job.attemptsMade + 1) * 1000;
        notification.nextRetryAt = new Date(Date.now() + nextDelay);

        await notification.save();

        console.log(
          `Notification failed: ${result.body}. Retry in ${nextDelay / 1000}s`,
        );

        throw new Error(
          `Webhook failed: ${result.statusCode} — ${result.body}`,
        );
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    },
  );

  worker.on("completed", (job, returnValue) => {
    if (!returnValue?.skipped) {
      console.log(`Job completed: ${job.id}`);
    }
  });

  worker.on("failed", async (job, err) => {
    console.error(`Job permanently failed: ${job.id} — ${err.message}`);

    // Move to dead-letter state
    try {
      const notification = await Notification.findOne({
        idempotencyKey: job.data.idempotencyKey,
      });
      if (notification) {
        notification.status = "DEAD_LETTER";
        notification.error = `Permanently failed after ${notification.attempts} attempts: ${err.message}`;
        notification.nextRetryAt = null;
        await notification.save();
      }
    } catch (dbErr) {
      console.error(`Failed to update DLQ status: ${dbErr.message}`);
    }
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err.message);
  });

  console.log(`Notification worker started (queue: ${QUEUE_NAME})`);
}

// stoping the service
async function stopWorker() {
  if (worker) {
    await worker.close();
    worker = null;
    console.log("Notification worker stopped");
  }
}

module.exports = { startWorker, stopWorker };
