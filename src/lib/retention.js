/**
 * Customer Retention & Win-Back Offer Engine
 */

export const WINBACK_THRESHOLD_DAYS = 30;
export const WINBACK_DISCOUNT_PERCENT = 10;
export const WINBACK_PROMO_CODE = 'BACK10';
export const WINBACK_DISCOUNT_NAME = 'Welcome Back (10% Off)';

/**
 * Computes days since last order, retention cohort, and win-back eligibility.
 * 
 * Cohorts:
 * - ACTIVE: Last order <= 30 days ago
 * - AT_RISK: Last order 31 - 60 days ago
 * - CHURNED: Last order > 60 days ago (or had orders but no date found)
 * - NEVER_ORDERED: 0 orders recorded
 */
export function getCustomerRetentionStatus(lastOrderDate, totalOrders = 0) {
  if (!lastOrderDate) {
    const hasPriorOrders = (totalOrders || 0) > 0;
    return {
      daysSinceLastOrder: null,
      retentionStatus: hasPriorOrders ? 'CHURNED' : 'NEVER_ORDERED',
      isWinBackEligible: hasPriorOrders,
    };
  }

  const lastOrderTime = new Date(lastOrderDate).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - lastOrderTime);
  const daysSinceLastOrder = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let retentionStatus = 'ACTIVE';
  if (daysSinceLastOrder <= 30) {
    retentionStatus = 'ACTIVE';
  } else if (daysSinceLastOrder <= 60) {
    retentionStatus = 'AT_RISK';
  } else {
    retentionStatus = 'CHURNED';
  }

  const isWinBackEligible = (totalOrders > 0 || !!lastOrderDate) && daysSinceLastOrder >= WINBACK_THRESHOLD_DAYS;

  return {
    daysSinceLastOrder,
    retentionStatus,
    isWinBackEligible,
  };
}

/**
 * Calculates 10% flat discount on qualifying subtotal.
 */
export function calcWinBackDiscount(subtotal) {
  if (!subtotal || subtotal <= 0) return 0;
  return Number((subtotal * (WINBACK_DISCOUNT_PERCENT / 100)).toFixed(2));
}

