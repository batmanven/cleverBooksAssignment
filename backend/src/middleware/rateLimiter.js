const rateLimit = require("express-rate-limit");
const config = require("../config/env");

const uploadRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: `Too many upload requests. Maximum ${config.rateLimit.max} uploads per minute. Please try again later.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { uploadRateLimiter };
