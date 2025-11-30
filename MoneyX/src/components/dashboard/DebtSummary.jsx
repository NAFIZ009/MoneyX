import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePersonalLoans } from '@/hooks/usePersonalLoans';
import { useEMIs } from '@/hooks/useEMIs';
import { formatCurrency } from '@/lib/utils';
import { Wallet, ChevronRight, TrendingDown, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DebtSummary = () => {
  const navigate = useNavigate();
  const { loans, loading: loansLoading } = usePersonalLoans();
  const { emis, loading: emisLoading } = useEMIs();
  const [summary, setSummary] = useState({
    totalDebt: 0,
    monthlyObligation: 0,
    activeDebts: 0,
    nextPaymentDue: null,
  });

  useEffect(() => {
    if (loansLoading || emisLoading) return;

    // Calculate total debt (remaining balances)
    const totalLoanBalance = loans.reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0);
    const totalEMIBalance = emis.reduce((sum, emi) => sum + (emi.remainingBalance || 0), 0);
    const totalDebt = totalLoanBalance + totalEMIBalance;

    // Calculate monthly obligation
    const monthlyLoans = loans.reduce((sum, loan) => sum + (loan.emi || 0), 0);
    const monthlyEMIs = emis.reduce((sum, emi) => sum + (emi.emiAmount || 0), 0);
    const monthlyObligation = monthlyLoans + monthlyEMIs;

    // Count active debts
    const activeDebts = loans.length + emis.length;

    // Find next payment due
    let nextPaymentDue = null;
    const allDueDates = [
      ...loans.filter(l => l.nextDueDate).map(l => l.nextDueDate),
      ...emis.filter(e => e.nextDueDate).map(e => e.nextDueDate),
    ];

    if (allDueDates.length > 0) {
      nextPaymentDue = allDueDates.reduce((earliest, date) => {
        return !earliest || date < earliest ? date : earliest;
      }, null);
    }

    setSummary({
      totalDebt,
      monthlyObligation,
      activeDebts,
      nextPaymentDue,
    });
  }, [loans, emis, loansLoading, emisLoading]);

  if (loansLoading || emisLoading) {
    return null;
  }

  if (summary.activeDebts === 0) {
    return null; // Don't show if no debts
  }

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(summary.nextPaymentDue);

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => navigate('/debts')}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Debts & EMIs
            </CardTitle>
            <CardDescription>
              {summary.activeDebts} active • {formatCurrency(summary.monthlyObligation)}/month
            </CardDescription>
          </div>
          <Badge variant={daysUntilDue && daysUntilDue <= 3 ? 'destructive' : 'secondary'}>
            {summary.activeDebts} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Debt */}
        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-red-900 dark:text-red-100">
                Total Outstanding
              </p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalDebt)}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Obligation */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Monthly Payment</p>
            <p className="text-sm font-semibold">
              {formatCurrency(summary.monthlyObligation)}
            </p>
          </div>
          {summary.nextPaymentDue && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Next Due</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <p className={`text-sm font-semibold ${
                  daysUntilDue <= 3 ? 'text-destructive' : ''
                }`}>
                  {daysUntilDue === 0 ? 'Today' : 
                   daysUntilDue === 1 ? 'Tomorrow' : 
                   daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` :
                   `${daysUntilDue} days`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/debts');
          }}
          className="w-full flex items-center justify-center gap-1 text-sm text-primary hover:underline py-2"
        >
          View all debts
          <ChevronRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
};