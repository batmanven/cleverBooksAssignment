const Notification = require("../models/Notification");

async function listNotifications(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: notifications,
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

async function getNotificationStats(req, res, next) {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = { PENDING: 0, SENT: 0, FAILED: 0, DEAD_LETTER: 0 };
    stats.forEach(({ _id, count }) => {
      statsMap[_id] = count;
    });

    const totalRetried = await Notification.countDocuments({
      attempts: { $gt: 1 },
      status: "SENT",
    });

    res.json({
      success: true,
      data: {
        ...statsMap,
        retried: totalRetried,
        total: Object.values(statsMap).reduce((a, b) => a + b, 0),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotifications,
  getNotificationStats,
};
