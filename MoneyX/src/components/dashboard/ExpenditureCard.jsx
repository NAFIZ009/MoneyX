import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFinance } from '@/hooks/useFinance';
import { formatCurrency, calculatePercentage } from '@/lib/utils';
import { hasReachedSpendingWarning } from '@/lib/calculations';
import { Wallet, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ExpenditureCard = () => {
  const { currentMonth } = useFinance();

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

  const spentAmount = initialExpendables - currentExpendables - reservedAmount;
  const spentPercentage = calculatePercentage(spentAmount, initialExpendables);
  const isWarning = hasReachedSpendingWarning({
    currentExpendables,
    initialExpendables,
  });

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          {/* Main Amount */}
          <div className="text-center space-y-2 mb-6">
            <p className="text-sm font-medium text-muted-foreground">
              Spendable Today
            </p>
            <div className="relative">
              <h1 className="text-5xl font-bold tracking-tight">
                {formatCurrency(currentExpendables)}
              </h1>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent this month</span>
              <span className="font-medium">{spentPercentage}%</span>
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
              <span>{formatCurrency(spentAmount)} spent</span>
              <span>{formatCurrency(initialExpendables - spentAmount)} left</span>
            </div>
          </div>

          {/* Reserved Amount */}
          {reservedAmount > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Reserved (Credit Cards)
                </span>
                <span className="font-medium">
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
            You've spent more than 50% of your budget. Consider reducing expenses.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};