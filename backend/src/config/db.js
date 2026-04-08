const mongoose = require("mongoose");
const config = require("./env");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`,
    );
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
