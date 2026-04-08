const { Queue } = require("bullmq");
const { getRedisConnection } = require("../config/redis");
const { generateNotificationKey } = require("../utils/idempotency");

const QUEUE_NAME = "discrepancy-notifications";
let queue = null;

// bullmq server
function getQueue() {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
      },
    });

    console.log(`BullMQ queue "${QUEUE_NAME}" initialized`);
  }
  return queue;
}

// publish it for vieewing
async function publishDiscrepancyEvents(
  settlement,
  order,
  discrepancies,
  jobId,
) {
  const q = getQueue();

  for (const discrepancy of discrepancies) {
    const idempotencyKey = generateNotificationKey(
      settlement.awbNumber,
      discrepancy.rule,
      settlement.batchId,
    );

    const jobData = {
      settlementId: settlement._id.toString(),
      awbNumber: settlement.awbNumber,
      merchantId: order.merchantId,
      courierPartner: order.courierPartner,
      discrepancyType: discrepancy.rule,
      description: discrepancy.description,
      expectedValue: discrepancy.expectedValue,
      actualValue: discrepancy.actualValue,
      variance: discrepancy.variance,
      suggestedAction: discrepancy.suggestedAction,
      idempotencyKey,
      reconciliationJobId: jobId.toString(),
      batchId: settlement.batchId,
    };

    await q.add(`notify-${discrepancy.rule}`, jobData, {
      jobId: idempotencyKey,
    });

    console.log(`Queued: ${discrepancy.rule} for ${settlement.awbNumber}`);
  }
}

module.exports = { getQueue, publishDiscrepancyEvents, QUEUE_NAME };
