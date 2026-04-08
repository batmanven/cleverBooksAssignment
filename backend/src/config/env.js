const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/cleverbooks",
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  reconciliationCron: process.env.RECONCILIATION_CRON || "0 2 * * *",
  webhookUrl: process.env.WEBHOOK_URL || "https://webhook.site/test",
  rateLimit: {
    windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX, 10) || 5,
  },
};
