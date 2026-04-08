const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    settlementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Settlement",
      required: true,
    },
    awbNumber: {
      type: String,
      required: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    discrepancyType: {
      type: String,
      required: true,
      enum: [
        "COD_SHORT_REMITTANCE",
        "WEIGHT_DISPUTE",
        "PHANTOM_RTO_CHARGE",
        "OVERDUE_REMITTANCE",
        "DUPLICATE_SETTLEMENT",
      ],
    },
    expectedValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    actualValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    suggestedAction: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "DEAD_LETTER"],
      default: "PENDING",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    nextRetryAt: {
      type: Date,
      default: null,
    },
    webhookResponse: {
      statusCode: Number,
      body: String,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reconciliationJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReconciliationJob",
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
