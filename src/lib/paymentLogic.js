// src/lib/paymentLogic.js

/**
 * Determines the payment status based on total paid and expected amount.
 * @param {number|string} totalPaid 
 * @param {number|string} expectedAmount 
 * @param {boolean} isCurrentlyOverdue 
 * @returns {'paid' | 'partial' | 'pending' | 'overdue'}
 */
export function calculatePaymentStatus(totalPaid, expectedAmount, isCurrentlyOverdue) {
  const paid = parseFloat(totalPaid) || 0;
  const expected = parseFloat(expectedAmount) || 0;

  if (expected <= 0) {
    if (paid > 0) return 'paid';
    return isCurrentlyOverdue ? 'overdue' : 'pending';
  }

  if (paid >= expected) return 'paid';
  if (paid > 0 && paid < expected) return 'partial';
  if (paid === 0 && isCurrentlyOverdue) return 'overdue';
  return 'pending';
}

/**
 * Sorts members according to priority: Overdue → Partial → Pending → Exempt → Paid
 * @param {Array} members 
 * @returns {Array} sorted array
 */
export function sortMembers(members) {
  const priority = {
    'overdue': 1,
    'partial': 2,
    'pending': 3,
    'exempt': 4,
    'paid': 5
  };

  return [...members].sort((a, b) => {
    const pA = priority[a.payment_status] || 99;
    const pB = priority[b.payment_status] || 99;
    return pA - pB;
  });
}

/**
 * Calculates the start of the current billing period based on plan type.
 * @param {'weekly' | 'monthly' | 'yearly'} plan 
 * @returns {string} ISO date string
 */
export function getPeriodStart(plan) {
  const now = new Date();
  if (plan === 'yearly') return new Date(now.getFullYear(), 0, 1).toISOString();
  if (plan === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString();
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}
