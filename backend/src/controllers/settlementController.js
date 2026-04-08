const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Settlement = require("../models/Settlement");
const Order = require("../models/Order");
const { parseCSV, parseJSON } = require("../utils/csvParser");

async function uploadSettlements(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Please upload a CSV or JSON file.",
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const content = req.file.buffer.toString("utf-8");
    let parsed;

    if (ext === ".csv") {
      parsed = await parseCSV(content);
    } else if (ext === ".json") {
      parsed = parseJSON(content);
    } else {
      return res.status(400).json({
        success: false,
        error: "Unsupported file format. Use CSV or JSON.",
      });
    }

    const { records, errors: parseErrors } = parsed;

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid records found in the file.",
        parseErrors,
      });
    }

    if (records.length > 1000) {
      return res.status(400).json({
        success: false,
        error: `Too many records (${records.length}). Maximum 1,000 rows per upload.`,
      });
    }

    const defaultBatchId = `BATCH-${new Date().toISOString().slice(0, 10)}-${uuidv4().slice(0, 8)}`;

    const insertResults = {
      inserted: 0,
      skipped: 0,
      failed: 0,
      failedRecords: [],
    };

    for (const record of records) {
      try {
        const batchId = record.batchId || defaultBatchId;

        await Settlement.updateOne(
          { awbNumber: record.awbNumber, batchId },
          {
            $setOnInsert: {
              ...record,
              batchId,
              status: "PENDING_REVIEW",
              discrepancies: [],
              processedAt: null,
            },
          },
          { upsert: true },
        );

        const existing = await Settlement.findOne({
          awbNumber: record.awbNumber,
          batchId,
          processedAt: { $ne: null },
        });

        if (existing) {
          insertResults.skipped++;
        } else {
          insertResults.inserted++;
        }
      } catch (err) {
        if (err.code === 11000) {
          insertResults.skipped++;
        } else {
          insertResults.failed++;
          insertResults.failedRecords.push({
            awbNumber: record.awbNumber,
            error: err.message,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Settlement batch processed successfully",
      batchId: records[0]?.batchId || defaultBatchId,
      summary: {
        totalInFile: records.length,
        inserted: insertResults.inserted,
        skippedDuplicates: insertResults.skipped,
        failed: insertResults.failed,
        parseErrors: parseErrors.length,
      },
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
      failedRecords:
        insertResults.failedRecords.length > 0
          ? insertResults.failedRecords
          : undefined,
    });
  } catch (error) {
    next(error);
  }
}

async function listSettlements(req, res, next) {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      courierPartner,
      batchId,
      search,
    } = req.query;

    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (batchId) {
      filter.batchId = batchId;
    }
    if (search) {
      filter.awbNumber = { $regex: search, $options: "i" };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "orders",
          localField: "awbNumber",
          foreignField: "awbNumber",
          as: "orderDetails",
        },
      },
      {
        $addFields: {
          order: { $arrayElemAt: ["$orderDetails", 0] },
        },
      },
      { $unset: "orderDetails" },
    ];

    if (courierPartner) {
      pipeline.push({
        $match: { "order.courierPartner": courierPartner.toLowerCase() },
      });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Settlement.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const settlements = await Settlement.aggregate(pipeline);

    res.json({
      success: true,
      data: settlements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getSettlementsSummary(req, res, next) {
  try {
    const [statusCounts, courierBreakdown, totalDiscrepancyValue] =
      await Promise.all([
        Settlement.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),

        Settlement.aggregate([
          { $match: { status: "DISCREPANCY" } },
          {
            $lookup: {
              from: "orders",
              localField: "awbNumber",
              foreignField: "awbNumber",
              as: "order",
            },
          },
          { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$order.courierPartner",
              discrepancyCount: { $sum: 1 },
              totalVariance: {
                $sum: {
                  $subtract: [
                    { $ifNull: ["$order.codAmount", 0] },
                    "$settledCodAmount",
                  ],
                },
              },
            },
          },
          { $sort: { discrepancyCount: -1 } },
        ]),

        Settlement.aggregate([
          { $match: { status: "DISCREPANCY" } },
          {
            $lookup: {
              from: "orders",
              localField: "awbNumber",
              foreignField: "awbNumber",
              as: "order",
            },
          },
          { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: null,
              totalCodeVariance: {
                $sum: {
                  $max: [
                    {
                      $subtract: [
                        { $ifNull: ["$order.codAmount", 0] },
                        { $ifNull: ["$settledCodAmount", 0] },
                      ],
                    },
                    0,
                  ],
                },
              },
              totalExcessRtoCharges: {
                $sum: {
                  $cond: [
                    { $eq: ["$order.orderStatus", "DELIVERED"] },
                    { $ifNull: ["$rtoCharge", 0] },
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ]);

    const statusMap = { PENDING_REVIEW: 0, MATCHED: 0, DISCREPANCY: 0 };
    if (statusCounts && statusCounts.length > 0) {
      statusCounts.forEach(({ _id, count }) => {
        if (_id) statusMap[_id] = count;
      });
    }

    const discValue = (totalDiscrepancyValue && totalDiscrepancyValue[0]) || {
      totalCodeVariance: 0,
      totalExcessRtoCharges: 0,
    };

    res.json({
      success: true,
      data: {
        totalSettlements:
          statusMap.PENDING_REVIEW + statusMap.MATCHED + statusMap.DISCREPANCY,
        statusCounts: statusMap,
        totalDiscrepancyValue:
          discValue.totalCodeVariance + discValue.totalExcessRtoCharges,
        courierBreakdown: courierBreakdown.map((c) => ({
          courier: c._id || "unknown",
          discrepancyCount: c.discrepancyCount,
          totalVariance: Math.round(c.totalVariance * 100) / 100,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getSettlementDetail(req, res, next) {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({
        success: false,
        error: "Settlement not found",
      });
    }

    const order = await Order.findOne({ awbNumber: settlement.awbNumber });

    res.json({
      success: true,
      data: {
        settlement,
        order: order || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function exportSettlements(req, res, next) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const settlements = await Settlement.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "AWB Number",
      "Batch ID",
      "Settled COD Amount",
      "Charged Weight",
      "Forward Charge",
      "RTO Charge",
      "COD Handling Fee",
      "Settlement Date",
      "Status",
      "Discrepancies",
    ];

    const rows = settlements.map((s) => [
      s.awbNumber,
      s.batchId,
      s.settledCodAmount,
      s.chargedWeight,
      s.forwardCharge,
      s.rtoCharge,
      s.codHandlingFee,
      s.settlementDate ? new Date(s.settlementDate).toISOString() : "",
      s.status,
      s.discrepancies.map((d) => d.rule).join("; "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="settlements_${status || "all"}_${Date.now()}.csv"`,
    );
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadSettlements,
  listSettlements,
  getSettlementsSummary,
  getSettlementDetail,
  exportSettlements,
};
