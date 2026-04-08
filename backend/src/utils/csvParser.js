const { parse } = require("csv-parse");

//parses cssv string content into an array of settlement record objects.
function parseCSV(csvContent) {
  return new Promise((resolve, reject) => {
    const records = [];
    const errors = [];

    const parser = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        const numericFields = [
          "settledCodAmount",
          "chargedWeight",
          "forwardCharge",
          "rtoCharge",
          "codHandlingFee",
        ];
        if (numericFields.includes(context.column)) {
          const num = parseFloat(value);
          return isNaN(num) ? value : num;
        }
        return value;
      },
    });

    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        const validation = validateSettlementRecord(
          record,
          records.length + errors.length + 1,
        );
        if (validation.valid) {
          records.push(validation.record);
        } else {
          errors.push(validation.error);
        }
      }
    });

    parser.on("error", (err) => reject(err));
    parser.on("end", () => resolve({ records, errors }));
  });
}

function parseJSON(jsonContent) {
  const records = [];
  const errors = [];

  let data;
  try {
    data = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error("Invalid JSON format");
  }

  if (!Array.isArray(data)) {
    throw new Error("JSON content must be an array of settlement records");
  }

  data.forEach((record, index) => {
    const validation = validateSettlementRecord(record, index + 1);
    if (validation.valid) {
      records.push(validation.record);
    } else {
      errors.push(validation.error);
    }
  });

  return { records, errors };
}

function validateSettlementRecord(record, rowNumber) {
  const requiredFields = ["awbNumber", "settledCodAmount", "chargedWeight"];
  const missing = requiredFields.filter(
    (f) => record[f] === undefined || record[f] === null || record[f] === "",
  );

  if (missing.length > 0) {
    return {
      valid: false,
      error: {
        row: rowNumber,
        message: `Missing required fields: ${missing.join(", ")}`,
        record,
      },
    };
  }

  const normalized = {
    awbNumber: String(record.awbNumber).trim(),
    settledCodAmount: parseFloat(record.settledCodAmount) || 0,
    chargedWeight: parseFloat(record.chargedWeight) || 0,
    forwardCharge: parseFloat(record.forwardCharge) || 0,
    rtoCharge: parseFloat(record.rtoCharge) || 0,
    codHandlingFee: parseFloat(record.codHandlingFee) || 0,
    settlementDate: record.settlementDate
      ? new Date(record.settlementDate)
      : null,
    batchId: record.batchId ? String(record.batchId).trim() : null,
  };

  if (normalized.settlementDate && isNaN(normalized.settlementDate.getTime())) {
    normalized.settlementDate = null;
  }

  return { valid: true, record: normalized };
}

module.exports = { parseCSV, parseJSON };
