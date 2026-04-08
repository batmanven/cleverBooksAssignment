const express = require("express");
const router = express.Router();
const {
  listJobs,
  getJobDetail,
  triggerReconciliation,
} = require("../controllers/jobController");

router.get("/", listJobs);
router.post("/trigger", triggerReconciliation);
router.get("/:id", getJobDetail);

module.exports = router;
