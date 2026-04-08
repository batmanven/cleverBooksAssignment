function errorHandler(err, req, res, _next) {
  console.error("Error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: "File too large. Maximum file size is 5MB.",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      error: "Unexpected field in upload.",
    });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: messages,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "Duplicate entry detected",
      details: err.keyValue,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal server error",
  });
}

module.exports = errorHandler;
