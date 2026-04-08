const Settlement = require("../models/Settlement");
const Order = require("../models/Order");
const ReconciliationJob = require("../models/ReconciliationJob");
const { runAllRules } = require("./discrepancyRules");

/**
//  *the full flow of the reconsilation process:
 * 1. Creates a ReconciliationJob record
 * 2. Fetches all unprocessed settlements
 * 3. For each settlement, looks up the matching Order
 * 4. Runs all 5 discrepancy rules
 * 5. Updates settlement status (MATCHED or DISCREPANCY)
 * 6. Publishes discrepancy events to BullMQ queue
 * 7. Also checks for Overdue Remittance (Rule 4) on orders without settlements
 * 8. Updates job with final counts
 */
async function runReconciliation(triggeredBy = "MANUAL") {
  const job = await ReconciliationJob.create({
    status: "RUNNING",
    triggeredBy,
    startedAt: new Date(),
  });

  console.log(`\n🔄 Reconciliation job started: ${job._id} (${triggeredBy})`);

  let matchedCount = 0;
  let discrepancyCount = 0;
  let pendingCount = 0;
  let totalRecords = 0;
  const errors = [];

  try {
    const pendingSettlements = await Settlement.find({
      status: "PENDING_REVIEW",
    });

    totalRecords = pendingSettlements.length;
    console.log(`   📋 Found ${totalRecords} pending settlements to process`);

    const duplicateAWBs = await Settlement.aggregate([
      {
        $group: {
          _id: "$awbNumber",
          batchIds: { $addToSet: "$batchId" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    const duplicateMap = {};
    duplicateAWBs.forEach((dup) => {
      duplicateMap[dup._id] = dup.batchIds;
    });

    for (const settlement of pendingSettlements) {
      try {
        // Find matching order
        const order = await Order.findOne({
          awbNumber: settlement.awbNumber,
        });

        if (!order) {
          // No matching order — it connanti  can't reconcile
          settlement.status = "PENDING_REVIEW";
          settlement.discrepancies = [
            {
              rule: "COD_SHORT_REMITTANCE",
              description: `No matching order found for AWB ${settlement.awbNumber}`,
              expectedValue: "Order record",
              actualValue: "Not found",
              variance: 0,
              suggestedAction: `Investigate missing order record for AWB ${settlement.awbNumber}`,
            },
          ];
          settlement.reconciliationJobId = job._id;
          settlement.processedAt = new Date();
          await settlement.save();
          pendingCount++;
          continue;
        }

        const duplicateBatchIds = duplicateMap[settlement.awbNumber] || [];
        const discrepancies = runAllRules(settlement, order, duplicateBatchIds);

        if (discrepancies.length > 0) {
          settlement.status = "DISCREPANCY";
          settlement.discrepancies = discrepancies;
          discrepancyCount++;
        } else {
          settlement.status = "MATCHED";
          settlement.discrepancies = [];
          matchedCount++;
        }

        settlement.reconciliationJobId = job._id;
        settlement.processedAt = new Date();
        await settlement.save();

        if (discrepancies.length > 0) {
          try {
            const {
              publishDiscrepancyEvents,
            } = require("../queues/discrepancyQueue");
            await publishDiscrepancyEvents(
              settlement,
              order,
              discrepancies,
              job._id,
            );
          } catch (queueErr) {
            console.warn(
              `Queue publish failed for ${settlement.awbNumber}: ${queueErr.message}`,
            );
          }
        }
      } catch (err) {
        console.error(
          `   ❌ Error processing ${settlement.awbNumber}: ${err.message}`,
        );
        errors.push({
          awbNumber: settlement.awbNumber,
          message: err.message,
        });
      }
    }

    //sTEP 2: Check for Overdue Remittances (Rule 4)
    // orders delivered >14 days ago with no settlement
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const overdueOrders = await Order.find({
      orderStatus: "DELIVERED",
      deliveryDate: { $lt: fourteenDaysAgo },
    });

    for (const order of overdueOrders) {
      const hasSettlement = await Settlement.findOne({
        awbNumber: order.awbNumber,
        settlementDate: { $ne: null },
      });

      if (!hasSettlement) {
        totalRecords++;
        discrepancyCount++;

        // Check if we already have a settlement record (without date)
        let settlement = await Settlement.findOne({
          awbNumber: order.awbNumber,
        });

        if (!settlement) {
          settlement = await Settlement.create({
            awbNumber: order.awbNumber,
            settledCodAmount: 0,
            chargedWeight: order.declaredWeight,
            forwardCharge: 0,
            rtoCharge: 0,
            codHandlingFee: 0,
            settlementDate: null,
            batchId: `OVERDUE-${job._id}`,
            status: "DISCREPANCY",
            reconciliationJobId: job._id,
            processedAt: new Date(),
            discrepancies: [
              {
                rule: "OVERDUE_REMITTANCE",
                description: `Remittance overdue. Delivered ${Math.floor((new Date() - new Date(order.deliveryDate)) / (1000 * 60 * 60 * 24))} days ago, no settlement received.`,
                expectedValue: `Settlement within 14 days`,
                actualValue: `No settlement`,
                variance:
                  Math.floor(
                    (new Date() - new Date(order.deliveryDate)) /
                      (1000 * 60 * 60 * 24),
                  ) - 14,
                suggestedAction: `Escalate with ${order.courierPartner} for immediate remittance of ₹${order.codAmount} for AWB ${order.awbNumber}.`,
              },
            ],
          });

          // Publish to queue
          try {
            const {
              publishDiscrepancyEvents,
            } = require("../queues/discrepancyQueue");
            await publishDiscrepancyEvents(
              settlement,
              order,
              settlement.discrepancies,
              job._id,
            );
          } catch (queueErr) {
            console.warn(
              `Queue publish failed for overdue ${order.awbNumber}: ${queueErr.message}`,
            );
          }
        }
      }
    }
    job.status = "COMPLETED";
    job.completedAt = new Date();
    job.totalRecords = totalRecords;
    job.matchedCount = matchedCount;
    job.discrepancyCount = discrepancyCount;
    job.pendingCount = pendingCount;
    job.errors = errors;
    await job.save();

    console.log(`\nReconciliation complete: ${job._id}`);
    console.log(
      `   Total: ${totalRecords} | Matched: ${matchedCount} | Discrepancies: ${discrepancyCount} | Pending: ${pendingCount} | Errors: ${errors.length}\n`,
    );

    return job;
  } catch (error) {
    job.status = "FAILED";
    job.completedAt = new Date();
    job.totalRecords = totalRecords;
    job.matchedCount = matchedCount;
    job.discrepancyCount = discrepancyCount;
    job.errors = [...errors, { awbNumber: "GLOBAL", message: error.message }];
    await job.save();

    console.error(`Reconciliation failed: ${error.message}`);
    throw error;
  }
}

module.exports = { runReconciliation };
