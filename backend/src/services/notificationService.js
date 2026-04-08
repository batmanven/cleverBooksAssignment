const axios = require("axios");
const config = require("../config/env");

// for notifiaton
async function sendWebhookNotification(payload) {
  const webhookUrl = config.webhookUrl;

  const notificationPayload = {
    merchantId: payload.merchantId,
    awbNumber: payload.awbNumber,
    discrepancyType: payload.discrepancyType,
    description: payload.description,
    expectedValue: payload.expectedValue,
    actualValue: payload.actualValue,
    variance: payload.variance,
    suggestedAction: payload.suggestedAction,
    courierPartner: payload.courierPartner,
    batchId: payload.batchId,
    timestamp: new Date().toISOString(),
    source: "CleverBooks Reconciliation Engine",
  };

  try {
    const response = await axios.post(webhookUrl, notificationPayload, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": payload.idempotencyKey,
        "X-Source": "cleverbooks-reconciler",
      },
    });

    return {
      success: true,
      statusCode: response.status,
      body:
        typeof response.data === "string"
          ? response.data.slice(0, 500)
          : JSON.stringify(response.data).slice(0, 500),
    };
  } catch (error) {
    return {
      success: false,
      statusCode: error.response?.status || 0,
      body: error.message,
    };
  }
}

module.exports = { sendWebhookNotification };
