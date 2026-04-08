const mongoose = require("mongoose");

const discrepancySchema = new mongoose.Schema(
  {
    rule: {
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
    description: { type: String, required: true },
    expectedValue: { type: mongoose.Schema.Types.Mixed },
    actualValue: { type: mongoose.Schema.Types.Mixed },
    variance: { type: Number, default: 0 },
    suggestedAction: { type: String },
  },
  { _id: false },
);

const settlementSchema = new mongoose.Schema(
  {
    awbNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    settledCodAmount: {
      type: Number,
      required: true,
    },
    chargedWeight: {
      type: Number,
      required: true,
    },
    forwardCharge: {
      type: Number,
      required: true,
      default: 0,
    },
    rtoCharge: {
      type: Number,
      required: true,
      default: 0,
    },
    codHandlingFee: {
      type: Number,
      required: true,
      default: 0,
    },
    settlementDate: {
      type: Date,
      default: null,
    },
    batchId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    // Reconciliation fields
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "MATCHED", "DISCREPANCY"],
      default: "PENDING_REVIEW",
      index: true,
    },
    discrepancies: [discrepancySchema],
    reconciliationJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReconciliationJob",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

//compound index for idempotency — same AWB + batch should not be inserted twice
settlementSchema.index({ awbNumber: 1, batchId: 1 }, { unique: true });

module.exports = mongoose.model("Settlement", settlementSchema);
