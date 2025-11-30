

/**
* Calculate loan monthly installment using EMI formula
* EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
* Where: P = Principal, R = Monthly Interest Rate, N = Number of months
*/
export function calculateLoanEMI({
    principalAmount = 0,
    annualInterestRate = 0,
    loanTermMonths = 12,
}) {
    if (principalAmount === 0 || loanTermMonths === 0) return 0;

    // If no interest, simple division
    if (annualInterestRate === 0) {
        return Math.round(principalAmount / loanTermMonths);
    }

    const monthlyRate = annualInterestRate / 12 / 100;
    const emi =
        (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
        (Math.pow(1 + monthlyRate, loanTermMonths) - 1);

    return Math.round(emi);
}

/**
 * Calculate total amount to be repaid (Principal + Interest)
 */
export function calculateTotalRepayment({
    principalAmount = 0,
    annualInterestRate = 0,
    loanTermMonths = 12,
}) {
    const emi = calculateLoanEMI({ principalAmount, annualInterestRate, loanTermMonths });
    return emi * loanTermMonths;
}

/**
 * Calculate total interest over loan term
 */
export function calculateTotalInterest({
    principalAmount = 0,
    annualInterestRate = 0,
    loanTermMonths = 12,
}) {
    const totalRepayment = calculateTotalRepayment({
        principalAmount,
        annualInterestRate,
        loanTermMonths,
    });
    return totalRepayment - principalAmount;
}

/**
 * Calculate remaining balance after N payments
 */
export function calculateRemainingBalance({
    principalAmount = 0,
    annualInterestRate = 0,
    loanTermMonths = 12,
    paymentsMade = 0,
}) {
    if (paymentsMade >= loanTermMonths) return 0;

    const emi = calculateLoanEMI({ principalAmount, annualInterestRate, loanTermMonths });
    const monthlyRate = annualInterestRate / 12 / 100;

    if (annualInterestRate === 0) {
        return principalAmount - emi * paymentsMade;
    }

    const remainingBalance =
        principalAmount *
        Math.pow(1 + monthlyRate, paymentsMade) -
        emi *
        ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);

    return Math.max(0, Math.round(remainingBalance));
}

/**
 * Calculate interest paid so far
 */
export function calculateInterestPaid({
    principalAmount = 0,
    annualInterestRate = 0,
    loanTermMonths = 12,
    paymentsMade = 0,
}) {
    const emi = calculateLoanEMI({ principalAmount, annualInterestRate, loanTermMonths });
    const totalPaid = emi * paymentsMade;
    const principalPaid = principalAmount - calculateRemainingBalance({
        principalAmount,
        annualInterestRate,
        loanTermMonths,
        paymentsMade,
    });

    return Math.max(0, totalPaid - principalPaid);
}

/**
 * Calculate EMI breakdown (Principal + Interest for a specific month)
 */
export function calculateEMIBreakdown({
    principalAmount = 0,
    annualInterestRate = 0,
    loanTermMonths = 12,
    monthNumber = 1,
}) {
    const emi = calculateLoanEMI({ principalAmount, annualInterestRate, loanTermMonths });
    const monthlyRate = annualInterestRate / 12 / 100;

    const remainingPrincipal = calculateRemainingBalance({
        principalAmount,
        annualInterestRate,
        loanTermMonths,
        paymentsMade: monthNumber - 1,
    });

    const interestForMonth = Math.round(remainingPrincipal * monthlyRate);
    const principalForMonth = emi - interestForMonth;

    return {
        emi,
        principal: principalForMonth,
        interest: interestForMonth,
        remainingBalance: remainingPrincipal - principalForMonth,
    };
}

/**
 * Calculate next payment due date
 */
export function calculateNextDueDate(startDate, paymentsMade, loanTermMonths) {
    if (paymentsMade >= loanTermMonths) return null;

    const nextPaymentMonth = paymentsMade + 1;
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + nextPaymentMonth);

    return dueDate;
}

/**
 * Calculate days until payment due
 */
export function calculateDaysUntilDue(dueDate) {
    if (!dueDate) return null;

    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Check if payment is overdue
 */
export function isPaymentOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
}

/**
 * Calculate loan completion percentage
 */
export function calculateCompletionPercentage(paymentsMade, loanTermMonths) {
    if (loanTermMonths === 0) return 0;
    return Math.round((paymentsMade / loanTermMonths) * 100);
}

/**
 * Calculate early payoff savings
 */
export function calculateEarlyPayoffSavings({
    principalAmount = 0,
    annualInterestRate = 0,
    loanTermMonths = 12,
    paymentsMade = 0,
    earlyPayoffAmount = 0,
}) {
    const remainingBalance = calculateRemainingBalance({
        principalAmount,
        annualInterestRate,
        loanTermMonths,
        paymentsMade,
    });

    const remainingMonths = loanTermMonths - paymentsMade;
    const emi = calculateLoanEMI({ principalAmount, annualInterestRate, loanTermMonths });
    const remainingTotalPayment = emi * remainingMonths;
    const remainingInterest = remainingTotalPayment - remainingBalance;

    const savings = Math.max(0, remainingInterest);

    return {
        remainingBalance,
        remainingTotalPayment,
        remainingInterest,
        earlyPayoffAmount: remainingBalance,
        savings,
    };
}

/**
 * Generate loan amortization schedule
 */
export function generateAmortizationSchedule({
    principalAmount = 0,
    annualInterestRate = 0,
    loanTermMonths = 12,
    startDate = new Date(),
}) {
    const schedule = [];
    const emi = calculateLoanEMI({ principalAmount, annualInterestRate, loanTermMonths });

    for (let month = 1; month <= loanTermMonths; month++) {
        const breakdown = calculateEMIBreakdown({
            principalAmount,
            annualInterestRate,
            loanTermMonths,
            monthNumber: month,
        });

        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + month);

        schedule.push({
            month,
            dueDate,
            emi: breakdown.emi,
            principal: breakdown.principal,
            interest: breakdown.interest,
            remainingBalance: breakdown.remainingBalance,
        });
    }

    return schedule;
}

/**
 * Calculate debt-to-income ratio
 */
export function calculateDebtToIncomeRatio(totalMonthlyDebtPayments, monthlyIncome) {
    if (monthlyIncome === 0) return 0;
    return Math.round((totalMonthlyDebtPayments / monthlyIncome) * 100);
}