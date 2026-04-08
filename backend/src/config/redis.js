const IORedis = require("ioredis");
const config = require("./env");

let connection = null;

const getRedisConnection = () => {
  if (!connection) {
    connection = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    connection.on("connect", () => {
      console.log(`Redis connected: ${config.redis.host}:${config.redis.port}`);
    });

    connection.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });
  }
  return connection;
};

module.exports = { getRedisConnection };
