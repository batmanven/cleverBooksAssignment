const crypto = require("crypto");

//generates an idempotency key for a settlement record.
//uses awbNumber + batchId to ensure uniqueness.
function generateSettlementKey(awbNumber, batchId) {
  return crypto
    .createHash("sha256")
    .update(`settlement:${awbNumber}:${batchId}`)
    .digest("hex");
}

//for notifciation
function generateNotificationKey(awbNumber, discrepancyType, batchId) {
  return crypto
    .createHash("sha256")
    .update(`notification:${awbNumber}:${discrepancyType}:${batchId}`)
    .digest("hex");
}

module.exports = { generateSettlementKey, generateNotificationKey };
