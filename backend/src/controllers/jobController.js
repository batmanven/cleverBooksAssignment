const ReconciliationJob = require("../models/ReconciliationJob");

async function listJobs(req, res, next) {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const jobs = await ReconciliationJob.find()
      .sort({ startedAt: -1 })
      .limit(limitNum)
      .lean();

    // /duratio
    const jobsWithDuration = jobs.map((job) => ({
      ...job,
      durationMs:
        job.completedAt && job.startedAt
          ? new Date(job.completedAt) - new Date(job.startedAt)
          : null,
    }));

    res.json({
      success: true,
      data: jobsWithDuration,
    });
  } catch (error) {
    next(error);
  }
}

async function getJobDetail(req, res, next) {
  try {
    const job = await ReconciliationJob.findById(req.params.id).lean();
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    res.json({
      success: true,
      data: {
        ...job,
        durationMs:
          job.completedAt && job.startedAt
            ? new Date(job.completedAt) - new Date(job.startedAt)
            : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function triggerReconciliation(req, res, next) {
  try {
    const { runReconciliation } = require("../services/reconciliationService");
    const jobPromise = runReconciliation("MANUAL");

    const job = await Promise.race([
      jobPromise,
      new Promise((resolve) => setTimeout(() => resolve(null), 500)),
    ]);

    res.status(202).json({
      success: true,
      message: "Reconciliation job triggered successfully",
      jobId: job?._id || "running",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listJobs,
  getJobDetail,
  triggerReconciliation,
};
