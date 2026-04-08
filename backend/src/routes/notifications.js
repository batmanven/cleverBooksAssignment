const express = require("express");
const router = express.Router();
const {
  listNotifications,
  getNotificationStats,
} = require("../controllers/notificationController");

router.get("/stats", getNotificationStats);
router.get("/", listNotifications);

module.exports = router;
