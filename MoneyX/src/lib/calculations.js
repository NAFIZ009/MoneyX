/**
 * Calculate initial expendables from salary
 * Formula: Salary - (Fixed Expenses + DPS + Credit Card Bills)
 * NOTE: Future Savings and Temporary Expenses are NOT deducted
 */
export function calculateInitialExpendables({
    salaryAmount = 0,
    fixedExpenses = [],
    dpsAccounts = [],
    creditCardBills = [],
    futureSavings = [],
    temporaryExpenses = [],
  }) {
    const totalFixedExpenses = fixedExpenses
      .filter(exp => exp.isActive)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
    const totalDPS = dpsAccounts
      .filter(dps => dps.isActive)
      .reduce((sum, dps) => sum + (dps.monthlyAmount || 0), 0);
  
    const totalCreditCardBills = creditCardBills.reduce(
      (sum, bill) => sum + (bill.totalPending || 0),
      0
    );
  
    // NOT DEDUCTING THESE FROM EXPENDABLES
    const totalFutureSavings = futureSavings
      .filter(saving => saving.isActive)
      .reduce((sum, saving) => sum + (saving.allocatedAmount || 0), 0);
  
    const totalTemporary = temporaryExpenses
      .filter(exp => exp.isActive)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
    const expendables =
      salaryAmount -
      totalFixedExpenses -
      totalDPS -
      totalCreditCardBills;
      // NOT subtracting totalFutureSavings and totalTemporary
  
    return {
      initialExpendables: Math.max(0, expendables),
      totalFixedExpenses,
      totalDPS,
      totalCreditCardBills,
      totalFutureSavings, // Just for tracking, not deducted
      totalTemporary, // Just for tracking, not deducted
    };
  }
  
  /**
   * Calculate current expendables (after expenses and credit card reservations)
   */
  export function calculateCurrentExpendables({
    initialExpendables = 0,
    reservedAmount = 0,
    dailyExpenses = 0,
  }) {
    return Math.max(0, initialExpendables - reservedAmount - dailyExpenses);
  }
  
  /**
   * Calculate DPS maturity amount
   */
  export function calculateDPSMaturity({
    monthlyAmount = 0,
    totalInstallments = 0,
    interestRate = 0,
  }) {
    // Simple interest calculation
    const totalDeposited = monthlyAmount * totalInstallments;
    const years = totalInstallments / 12;
    const interest = (totalDeposited * interestRate * years) / 100;
    return totalDeposited + interest;
  }
  
  /**
   * Calculate FD maturity amount
   */
  export function calculateFDMaturity({
    principalAmount = 0,
    interestRate = 0,
    years = 0,
  }) {
    // Compound interest calculation
    const maturityAmount = principalAmount * Math.pow(1 + interestRate / 100, years);
    return Math.round(maturityAmount);
  }
  
  /**
   * Calculate total DPS value (current accumulated value)
   */
  export function calculateDPSCurrentValue({
    monthlyAmount = 0,
    installmentsPaid = 0,
  }) {
    return monthlyAmount * installmentsPaid;
  }
  
  /**
   * Calculate spending percentage
   */
  export function calculateSpendingPercentage({
    spent = 0,
    total = 0,
  }) {
    if (total === 0) return 0;
    return Math.round((spent / total) * 100);
  }
  
  /**
   * Check if spending crossed threshold (50%)
   */
  export function hasReachedSpendingWarning({
    currentExpendables = 0,
    initialExpendables = 0,
  }) {
    if (initialExpendables === 0) return false;
    const remaining = (currentExpendables / initialExpendables) * 100;
    return remaining <= 50;
  }
  
  /**
   * Calculate savings rate
   */
  export function calculateSavingsRate({
    income = 0,
    expenses = 0,
  }) {
    if (income === 0) return 0;
    const savings = income - expenses;
    return Math.round((savings / income) * 100);
  }
  
  /**
   * Group expenses by category
   */
  export function groupExpensesByCategory(expenses = []) {
    const grouped = expenses.reduce((acc, expense) => {
      const category = expense.category || 'others';
      if (!acc[category]) {
        acc[category] = {
          category,
          totalAmount: 0,
          count: 0,
          expenses: [],
        };
      }
      acc[category].totalAmount += expense.amount;
      acc[category].count += 1;
      acc[category].expenses.push(expense);
      return acc;
    }, {});
  
    return Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount);
  }
  
  /**
   * Group expenses by date
   */
  export function groupExpensesByDate(expenses = []) {
    const grouped = expenses.reduce((acc, expense) => {
      const date = expense.date.toDate().toDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          totalAmount: 0,
          count: 0,
          expenses: [],
        };
      }
      acc[date].totalAmount += expense.amount;
      acc[date].count += 1;
      acc[date].expenses.push(expense);
      return acc;
    }, {});
  
    return Object.values(grouped).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }
  
  /**
   * Find top spending days
   */
  export function getTopSpendingDays(expenses = [], limit = 5) {
    const grouped = groupExpensesByDate(expenses);
    return grouped
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  }