const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { uploadRateLimiter } = require("../middleware/rateLimiter");
const {
  uploadSettlements,
  listSettlements,
  getSettlementsSummary,
  getSettlementDetail,
  exportSettlements,
} = require("../controllers/settlementController");

router.post(
  "/upload",
  uploadRateLimiter,
  upload.single("file"),
  uploadSettlements,
);
router.get("/export", exportSettlements);
router.get("/summary", getSettlementsSummary);
router.get("/", listSettlements);
router.get("/:id", getSettlementDetail);

module.exports = router;
