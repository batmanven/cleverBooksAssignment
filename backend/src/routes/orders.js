const express = require("express");
const router = express.Router();
const { listOrders } = require("../controllers/orderController");

router.get("/", listOrders);

module.exports = router;
