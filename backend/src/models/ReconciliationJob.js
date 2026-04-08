const mongoose = require('mongoose');

const reconciliationJobSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['RUNNING', 'COMPLETED', 'FAILED'],
      default: 'RUNNING',
      index: true,
    },
    triggeredBy: {
      type: String,
      enum: ['CRON', 'MANUAL'],
      required: true,
    },
    cronExpression: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    totalRecords: {
      type: Number,
      default: 0,
    },
    matchedCount: {
      type: Number,
      default: 0,
    },
    discrepancyCount: {
      type: Number,
      default: 0,
    },
    pendingCount: {
      type: Number,
      default: 0,
    },
    errors: [
      {
        awbNumber: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ReconciliationJob', reconciliationJobSchema);
