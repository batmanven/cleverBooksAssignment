
//  * - 50+ mock Order records across multiple merchants & courier partners
//  * - 1 settlement batch (~40 records) with intentional discrepancies:
//  *   - 5 COD short-remittances
//  *   - 4 weight disputes
//  *   - 3 phantom RTO charges
//  *   - 3 overdue remittances 
//  *   - 2 duplicate settlements
//  *   - ~23 matched (clean) records


const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Order = require('../src/models/Order');
const Settlement = require('../src/models/Settlement');
const ReconciliationJob = require('../src/models/ReconciliationJob');
const Notification = require('../src/models/Notification');

const COURIER_PARTNERS = ['shiprocket', 'delhivery', 'bluedart', 'dtdc', 'ekart'];
const MERCHANTS = ['MERCH001', 'MERCH002', 'MERCH003', 'MERCH004', 'MERCH005'];
const BATCH_ID = 'BATCH-2026-04-001';
const DUPLICATE_BATCH_ID = 'BATCH-2026-04-002';

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAWB(index) {
  return `AWB${String(index).padStart(8, '0')}`;
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function generateOrders() {
  const orders = [];

  for (let i = 1; i <= 55; i++) {
    const awb = generateAWB(i);
    const courier = COURIER_PARTNERS[i % COURIER_PARTNERS.length];
    const merchant = MERCHANTS[i % MERCHANTS.length];
    const orderDate = daysAgo(Math.floor(Math.random() * 30) + 10);

    let orderStatus;
    let deliveryDate = null;
    let codAmount;

    // Orders 1-35: DELIVERED (with COD)
    if (i <= 35) {
      orderStatus = 'DELIVERED';
      deliveryDate = daysAgo(Math.floor(Math.random() * 20) + 2);
      codAmount = randomBetween(200, 5000);
    }
    // Orders 36-42: RTO
    else if (i <= 42) {
      orderStatus = 'RTO';
      deliveryDate = null;
      codAmount = randomBetween(500, 3000);
    }
    // Orders 43-48: IN_TRANSIT
    else if (i <= 48) {
      orderStatus = 'IN_TRANSIT';
      deliveryDate = null;
      codAmount = randomBetween(300, 2000);
    }
    // Orders 49-52: DELIVERED but old (for overdue test)
    else if (i <= 52) {
      orderStatus = 'DELIVERED';
      deliveryDate = daysAgo(Math.floor(Math.random() * 10) + 18); // 18-27 days ago
      codAmount = randomBetween(800, 4000);
    }
    // Orders 53-55: LOST
    else {
      orderStatus = 'LOST';
      deliveryDate = null;
      codAmount = randomBetween(1000, 5000);
    }

    const declaredWeight = randomBetween(0.2, 10);

    orders.push({
      awbNumber: awb,
      merchantId: merchant,
      courierPartner: courier,
      orderStatus,
      codAmount: Math.round(codAmount),
      declaredWeight: Math.round(declaredWeight * 10) / 10,
      orderDate,
      deliveryDate,
    });
  }

  return orders;
}

function generateSettlements(orders) {
  const settlements = [];

  for (let i = 0; i < 23; i++) {
    const order = orders[i];
    settlements.push({
      awbNumber: order.awbNumber,
      settledCodAmount: order.codAmount, // Exact match
      chargedWeight: order.declaredWeight, // Exact match
      forwardCharge: randomBetween(30, 120),
      rtoCharge: 0,
      codHandlingFee: Math.round(order.codAmount * 0.015), // 1.5%
      settlementDate: daysAgo(Math.floor(Math.random() * 5)),
      batchId: BATCH_ID,
    });
  }

  // ===========================================
  // COD SHORT-REMITTANCE (orders 24-28 → 5 records)
  // Rule 1: settledCodAmount < codAmount - tolerance
  // ===========================================
  for (let i = 23; i < 28; i++) {
    const order = orders[i];
    const shortfall = randomBetween(50, 500);
    settlements.push({
      awbNumber: order.awbNumber,
      settledCodAmount: order.codAmount - shortfall, // Lower than expected
      chargedWeight: order.declaredWeight,
      forwardCharge: randomBetween(30, 120),
      rtoCharge: 0,
      codHandlingFee: Math.round(order.codAmount * 0.02),
      settlementDate: daysAgo(Math.floor(Math.random() * 5)),
      batchId: BATCH_ID,
    });
  }

  // WEIGHT DISPUTE (orders 29-32 → 4 records)
  // Rule 2: chargedWeight > declaredWeight × 1.10
  for (let i = 28; i < 32; i++) {
    const order = orders[i];
    const inflatedWeight = Math.round(order.declaredWeight * randomBetween(1.2, 1.8) * 10) / 10;
    settlements.push({
      awbNumber: order.awbNumber,
      settledCodAmount: order.codAmount,
      chargedWeight: inflatedWeight, // More than 10% over declared
      forwardCharge: randomBetween(50, 200),
      rtoCharge: 0,
      codHandlingFee: Math.round(order.codAmount * 0.015),
      settlementDate: daysAgo(Math.floor(Math.random() * 5)),
      batchId: BATCH_ID,
    });
  }

  // PHANTOM RTO CHARGE (orders 33-35 → 3 records)
  // Rule 3: rtoCharge > 0 but orderStatus = DELIVERED
  for (let i = 32; i < 35; i++) {
    const order = orders[i]; // These are DELIVERED
    settlements.push({
      awbNumber: order.awbNumber,
      settledCodAmount: order.codAmount,
      chargedWeight: order.declaredWeight,
      forwardCharge: randomBetween(30, 100),
      rtoCharge: randomBetween(50, 200), // Charged RTO on delivered order!
      codHandlingFee: Math.round(order.codAmount * 0.015),
      settlementDate: daysAgo(Math.floor(Math.random() * 5)),
      batchId: BATCH_ID,
    });
  }

  // OVERDUE REMITTANCE — orders 49-51 have no settlement
  // Rule 4: deliveryDate > 14 days ago, no settlementDate
  for (let i = 0; i < 2; i++) {
    const order = orders[i];
    settlements.push({
      awbNumber: order.awbNumber,
      settledCodAmount: order.codAmount,
      chargedWeight: order.declaredWeight,
      forwardCharge: randomBetween(30, 120),
      rtoCharge: 0,
      codHandlingFee: Math.round(order.codAmount * 0.015),
      settlementDate: daysAgo(Math.floor(Math.random() * 3)),
      batchId: DUPLICATE_BATCH_ID, // Different batch — same AWB!
    });
  }

  for (let i = 35; i < 40; i++) {
    const order = orders[i];
    settlements.push({
      awbNumber: order.awbNumber,
      settledCodAmount: 0,
      chargedWeight: order.declaredWeight,
      forwardCharge: randomBetween(30, 100),
      rtoCharge: randomBetween(30, 100),
      codHandlingFee: 0,
      settlementDate: daysAgo(Math.floor(Math.random() * 5)),
      batchId: BATCH_ID,
    });
  }

  return settlements;
}

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cleverbooks';
    console.log(`\nConnecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    console.log('Clearing existing data...');
    await Order.deleteMany({});
    await Settlement.deleteMany({});
    await ReconciliationJob.deleteMany({});
    await Notification.deleteMany({});
    console.log('   Done.\n');

    // Generate and insert orders
    const orders = generateOrders();
    console.log(`📦 Inserting ${orders.length} orders...`);
    await Order.insertMany(orders);
    console.log('   Done.\n');

    const settlements = generateSettlements(orders);
    console.log(`Inserting ${settlements.length} settlement records...`);
    await Settlement.insertMany(settlements);
    console.log('   Done.\n');

    console.log('Seed Data Summary');
    console.log(`   Orders created:           ${orders.length}`);
    console.log(`   Settlements created:       ${settlements.length}`);
    console.log('');
    console.log('   Intentional discrepancies:');
    console.log('   ├─ COD Short-remittance:   5 records (AWB24-AWB28)');
    console.log('   ├─ Weight Disputes:         4 records (AWB29-AWB32)');
    console.log('   ├─ Phantom RTO Charges:     3 records (AWB33-AWB35)');
    console.log('   ├─ Overdue Remittances:     3 orders  (AWB49-AWB51, no settlement)');
    console.log('   ├─ Duplicate Settlements:   2 records (AWB01-AWB02 in 2 batches)');
    console.log('   └─ Clean/Matched:           ~28 records');
    console.log('');
    console.log(`   Batch IDs: ${BATCH_ID}, ${DUPLICATE_BATCH_ID}`);
    console.log(`   Merchants: ${MERCHANTS.join(', ')}`);
    console.log(`   Couriers:  ${COURIER_PARTNERS.join(', ')}`);
    console.log('\n');

    console.log('Seed data generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
