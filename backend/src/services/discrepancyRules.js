// all 5 rules from the assignment spec.

/**
 * rule 1: COD Short-remittance
 * settledCodAmount < codAmount − tolerance
 * tolerance = min(2% of codAmount, ₹10)
 */
function checkCodShortRemittance(settlement, order) {
  if (!order.codAmount || order.codAmount === 0) return null;

  const tolerance = Math.min(order.codAmount * 0.02, 10);
  const threshold = order.codAmount - tolerance;

  if (settlement.settledCodAmount < threshold) {
    const variance = order.codAmount - settlement.settledCodAmount;
    return {
      rule: "COD_SHORT_REMITTANCE",
      description: `COD short-remittance of ₹${variance.toFixed(2)}. Expected ≥ ₹${threshold.toFixed(2)}, received ₹${settlement.settledCodAmount.toFixed(2)}.`,
      expectedValue: order.codAmount,
      actualValue: settlement.settledCodAmount,
      variance: Math.round(variance * 100) / 100,
      suggestedAction: `Raise dispute with ${order.courierPartner} for ₹${variance.toFixed(2)} shortfall on AWB ${settlement.awbNumber}. Request remittance adjustment.`,
    };
  }

  return null;
}

/**
 * rule 2: Weight Dispute
 *chargedWeight > declaredWeight × 1.10 (more than 10% over declared)
 */
function checkWeightDispute(settlement, order) {
  const threshold = order.declaredWeight * 1.1;

  if (settlement.chargedWeight > threshold) {
    const excess = settlement.chargedWeight - order.declaredWeight;
    return {
      rule: "WEIGHT_DISPUTE",
      description: `Weight overcharge: courier charged ${settlement.chargedWeight}kg vs declared ${order.declaredWeight}kg (${((excess / order.declaredWeight) * 100).toFixed(1)}% excess).`,
      expectedValue: order.declaredWeight,
      actualValue: settlement.chargedWeight,
      variance: Math.round(excess * 100) / 100,
      suggestedAction: `Dispute weight charge with ${order.courierPartner}. Provide proof of actual weight (${order.declaredWeight}kg) for AWB ${settlement.awbNumber}.`,
    };
  }

  return null;
}

/**
 *rRule 3: Phantom RTO Charge
 *rtoCharge > 0 but orderStatus = DELIVERED
 */
function checkPhantomRtoCharge(settlement, order) {
  if (settlement.rtoCharge > 0 && order.orderStatus === "DELIVERED") {
    return {
      rule: "PHANTOM_RTO_CHARGE",
      description: `RTO charge of ₹${settlement.rtoCharge.toFixed(2)} applied to a DELIVERED order. RTO charges should be ₹0 for delivered shipments.`,
      expectedValue: 0,
      actualValue: settlement.rtoCharge,
      variance: settlement.rtoCharge,
      suggestedAction: `Request reversal of ₹${settlement.rtoCharge.toFixed(2)} phantom RTO charge from ${order.courierPartner} for AWB ${settlement.awbNumber}. Order was successfully delivered.`,
    };
  }

  return null;
}

/**
 *rule 4: Overdue Remittance
 * deliveryDate is more than 14 days ago but no settlementDate exists
 *
 * Note: This is checked differently — it operates on orders that have
 * no matching settlement, not on settlement records themselves.
 * This function checks a settlement record that has no settlementDate.
 */
function checkOverdueRemittance(settlement, order) {
  if (!order.deliveryDate) return null;

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const deliveryDate = new Date(order.deliveryDate);

  if (deliveryDate < fourteenDaysAgo && !settlement.settlementDate) {
    const daysOverdue = Math.floor(
      (new Date() - deliveryDate) / (1000 * 60 * 60 * 24),
    );
    return {
      rule: "OVERDUE_REMITTANCE",
      description: `Remittance overdue by ${daysOverdue} days. Order delivered on ${deliveryDate.toISOString().slice(0, 10)} but no settlement date recorded.`,
      expectedValue: `Settlement within 14 days of delivery`,
      actualValue: `${daysOverdue} days since delivery, no settlement`,
      variance: daysOverdue - 14,
      suggestedAction: `Escalate with ${order.courierPartner} for immediate remittance of ₹${order.codAmount} for AWB ${settlement.awbNumber}. Overdue by ${daysOverdue - 14} days.`,
    };
  }

  return null;
}

/**
 *rule 5: Duplicate Settlement
 * Same awbNumber appears in more than one settlement batch.
 * This is checked by count of distinct batchIds for the same awbNumber.
 */
function checkDuplicateSettlement(settlement, _order, duplicateBatchIds) {
  if (duplicateBatchIds && duplicateBatchIds.length > 1) {
    return {
      rule: "DUPLICATE_SETTLEMENT",
      description: `AWB ${settlement.awbNumber} appears in ${duplicateBatchIds.length} settlement batches: ${duplicateBatchIds.join(", ")}. Possible double-processing.`,
      expectedValue: 1,
      actualValue: duplicateBatchIds.length,
      variance: duplicateBatchIds.length - 1,
      suggestedAction: `Verify with courier if AWB ${settlement.awbNumber} was double-settled. Request reversal of duplicate remittance across batches: ${duplicateBatchIds.join(", ")}.`,
    };
  }

  return null;
}

function runAllRules(settlement, order, duplicateBatchIds = []) {
  const discrepancies = [];

  const rules = [
    checkCodShortRemittance,
    checkWeightDispute,
    checkPhantomRtoCharge,
    checkOverdueRemittance,
  ];

  for (const rule of rules) {
    const result = rule(settlement, order);
    if (result) discrepancies.push(result);
  }

  const dupResult = checkDuplicateSettlement(
    settlement,
    order,
    duplicateBatchIds,
  );
  if (dupResult) discrepancies.push(dupResult);

  return discrepancies;
}

module.exports = {
  checkCodShortRemittance,
  checkWeightDispute,
  checkPhantomRtoCharge,
  checkOverdueRemittance,
  checkDuplicateSettlement,
  runAllRules,
};
