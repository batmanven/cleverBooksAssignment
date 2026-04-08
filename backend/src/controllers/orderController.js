const Order = require("../models/Order");

async function listOrders(req, res, next) {
  try {
    const {
      status,
      courierPartner,
      merchantId,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (courierPartner) filter.courierPartner = courierPartner.toLowerCase();
    if (merchantId) filter.merchantId = merchantId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
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

module.exports = {
  listOrders,
};
