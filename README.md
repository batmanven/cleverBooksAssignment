# Courier Settlement Reconciliation and Alert Engine

A MERN stack application designed for logistics intelligence. This system automates the reconciliation of courier settlement claims against merchant order records, identifies financial and operational discrepancies, and triggers merchant alerts through a decoupled asynchronous architecture.

---

## 1. Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (for MongoDB and Redis) or local instances of both.

### Infrastructure Setup

The application requires MongoDB and Redis. Use the provided Docker Compose configuration to initialize them:

```bash
docker-compose up -d
```

### Backend Configuration

1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure environment variables in `.env` (refer to `.env.example`):
   - `MONGODB_URI`: Your MongoDB connection string.
   - `REDIS_HOST`: Localhost or your Redis container address.
   - `WEBHOOK_URL`: Your unique endpoint from [webhook.site](https://webhook.site).
4. Seed the database with test data: `npm run seed`
5. Start the server: `npm run dev` (Runs on port 5001)

### Frontend Configuration

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev` (Runs on port 5173)

---

## 2. System Architecture and Design Decisions

### Decoupled Worker Pattern

A critical requirement of this project was the decoupling of reconciliation logic from notification delivery. We utilized **BullMQ and Redis** to implement a robust producer-consumer pattern.

- **Producer**: The Reconciliation Service identifies discrepancies and publishes an event to the `discrepancy-notifications` queue.
- **Consumer**: A separate worker service processes this queue and handles the external API communication.
  This architecture ensures that throughput issues or downtime with external notification providers do not block the core financial reconciliation process.

### Reliability and Idempotency

To prevent duplicate notifications and ensure data integrity:

- **Unique Payload Keys**: Notification events include an idempotency key derived from the AWB number and Discrepancy Type.
- **Retry Strategy**: The worker implements exponential backoff (starting at 1s up to 16s) to handle transient network failures when calling the webhook API.
- **Dead-Letter Management**: Notifications that fail after five attempts are marked as `DEAD_LETTER` in the database for manual intervention, preventing infinite loops.

### Timezone-Aware Scheduling

The automated reconciliation job is configured using `node-cron` with specific support for the `Asia/Kolkata` timezone, ensuring that the job runs consistently at 2:00 AM IST regardless of the server's local clock setting.

---

## 3. Discrepancy Detection Rules

The engine implements all five logic rules requested in the assignment:

1. **COD Short-remittance**: Flags cases where the remitted amount is lower than expected beyond a dynamic tolerance (lower of 2% or ₹10).
2. **Weight Dispute**: Identifies shipments where the charged weight exceeds the declared weight by more than 10%.
3. **Phantom RTO Charge**: Detects RTO fees applied to shipments successfully marked as DELIVERED.
4. **Overdue Remittance**: Scans for shipments delivered over 14 days ago that have not yet been settled.
5. **Duplicate Settlement**: Flagging AWBs that appear in multiple settlement batches, preventing double-payouts.

---

## 4. Key Assumptions & System Design Decisions

- **Currency & Precision**: All financial calculations assume **INR** as the base currency. To prevent floating-point errors common in financial systems, calculations are performed using scaled integers where applicable, or rounded to two decimal places at the boundaries.
- **Prepaid vs COD**: Rule 1 (Short-remittance) logic is triggered only when the `paymentMode` is `COD`. Prepaid orders are assumed to have a zero expected settlement amount from the courier.
- **AWB Uniqueness**: The system assumes an AWB (Air Waybill) number is unique across all time.
- **Timezone Consistency**: The system assumes and enforces **Asia/Kolkata (IST)** for all reconciliation jobs and reporting. Any input data without a timezone offset is treated as IST.
- **Batch Atomicity**: While data ingestion is record-level, the system assumes that a 'Partial Success' state is acceptable for batch uploads. Successfully validated rows are committed, while failing rows are logged and returned as part of a batch error report.

---

## 5. Technical Clarifications & Open Questions

To demonstrate readiness for a production environment, I have identified the following areas for further exploration and stakeholder clarification:

### Retry Strategy & Resilience

- **Webhook Rate Limiting**: Our current worker uses a fixed concurrency of 5 and a rate limit of 10/sec. If the merchant's endpoint is more restrictive, how should we handle `429 Too Many Requests`? Should we implement a global throttle or a dedicated "slow-lane" queue?
- **Exponential Backoff**: The current backoff caps at 16 seconds. For high-volume systems, should we implement a "jitter" factor to prevent a "thundering herd" effect when the external service recovers?

### Timezone & Localization

- **Data Source Variance**: While the system enforces `Asia/Kolkata` (IST), if a shipping partner provides data in UTC or another regional timezone (e.g., for international shipments), should we normalize at the **Ingestion Layer** or maintain original offsets for legal auditing?

### Edge Case Handling

- **AWB Recycling**: Air Waybill numbers are frequently recycled every 6-12 months. Should our uniqueness index be scoped by `AWB + FinancialYear` to prevent false "duplicate settlement" flags on historical records?
- **Zero/Negative Remittance**: How should Rule 1 handle cases where the remitted amount is 0 or negative due to return fees? Currently, it flags these as short-remittances, but they might be logically correct "Net Zero" settlements.

### Batch Management & Partial Failures

- **Atomicity vs. Availability**: If a 10,000-row file contains a single corrupt row (e.g., non-numeric amount), should the entire batch fail (Standard Transactional Integrity) or should we allow a **"Partial Success"** where 9,999 rows are committed and the one failure is logged in a separate "Error Queue" for manual review?

---

## 6. Future Improvements

Given more time, the following enhancements would be prioritized:

- **Authentication**: Implementing RBAC (Role-Based Access Control) for different merchant administrative levels.
- **Advanced Filtering**: Adding server-side search and complex date-range filtering for large datasets.
- **Notification Aggregation**: Buffering multiple discrepancies for the same merchant into a single summary notification every hour to reduce noise.
- **Unit Testing**: Increasing test coverage for the reconciliation rules engine using Jest to ensure logic stability as new rules are added.

---

CleverBooks Engineering Take-Home Assignment Submission.
