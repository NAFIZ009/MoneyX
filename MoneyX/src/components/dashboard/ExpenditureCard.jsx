import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFinance } from '@/hooks/useFinance';
import { useExpenses } from '@/hooks/useExpenses';
import { formatCurrency, calculatePercentage, isToday } from '@/lib/utils';
import { hasReachedSpendingWarning } from '@/lib/calculations';
import { Wallet, AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ExpenditureCard = () => {
  const { currentMonth } = useFinance();
  const { expenses } = useExpenses();

  // Calculate today's spending
  const todaySpending = useMemo(() => {
    return expenses
      .filter((expense) => isToday(expense.date.toDate()))
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  if (!currentMonth?.salaryReceived) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center py-12">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Add your salary to see your expendables
          </p>
        </CardContent>
      </Card>
    );
  }

  const { currentExpendables, initialExpendables, reservedAmount } =
    currentMonth.calculations;

  // Calculate total spent (including reserved amounts)
  const totalSpent = initialExpendables - currentExpendables;
  const spentPercentage = calculatePercentage(totalSpent, initialExpendables);
  
  const isWarning = hasReachedSpendingWarning({
    currentExpendables,
    initialExpendables,
  });

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <CardContent className="pt-6 space-y-6">
          {/* 1. TODAY'S SPENDING - FIRST (as requested) */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-red-900 dark:text-red-100">
                  Spent Today
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(todaySpending)}
                </p>
              </div>
            </div>
          </div>

          {/* 2. MAIN EXPENDABLES - SECOND (as requested) */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Spendable This Month
            </p>
            <div className="relative">
              <h1 className="text-5xl font-bold tracking-tight">
                {formatCurrency(currentExpendables)}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              of {formatCurrency(initialExpendables)} initial budget
            </p>
          </div>

          {/* 3. PROGRESS BAR - THIRD (as requested) */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Month Progress</span>
              <span className="font-medium">{spentPercentage}% used</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  isWarning ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${spentPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(totalSpent)} spent</span>
              <span>{formatCurrency(currentExpendables)} remaining</span>
            </div>
          </div>

          {/* Reserved Amount for Credit Cards */}
          {reservedAmount > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-yellow-900 dark:text-yellow-100 font-medium">
                  💳 Reserved (Credit Cards)
                </span>
                <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {formatCurrency(reservedAmount)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning Alert */}
      {isWarning && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You've used more than 50% of your monthly budget. Consider reducing expenses.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};