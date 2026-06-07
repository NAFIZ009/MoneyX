/**
 * Get the outstanding amount owed on a credit card bill.
 * Prefer remainingBalance; fall back to totalPending minus paidAmount.
 */
export function getBillOutstanding(billData) {
  if (!billData) return 0;

  if (typeof billData.remainingBalance === 'number') {
    return Math.max(0, billData.remainingBalance);
  }

  const total = billData.totalPending || 0;
  const paid = billData.paidAmount || 0;
  return Math.max(0, total - paid);
}

/**
 * Default fields for a new credit card bill document.
 */
export function createEmptyBill(monthKey, amount = 0, previousBill = 0) {
  return {
    monthKey,
    previousBill,
    thisMonthTransactions: amount,
    totalPending: previousBill + amount,
    paidAmount: 0,
    remainingBalance: previousBill + amount,
    isPaidFull: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
