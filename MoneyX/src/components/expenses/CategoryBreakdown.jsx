import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/hooks/useExpenses';
import { formatCurrency, calculatePercentage } from '@/lib/utils';
import { groupExpensesByCategory, getTopSpendingDays } from '@/lib/calculations';
import { getCategoryIcon, getCategoryLabel, getCategoryColor } from '@/lib/categories';
import { TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CategoryBreakdown = () => {
  const { expenses } = useExpenses();

  const categoryData = useMemo(() => {
    return groupExpensesByCategory(expenses);
  }, [expenses]);

  const topSpendingDays = useMemo(() => {
    return getTopSpendingDays(expenses, 5);
  }, [expenses]);

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data to analyze yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Overview</CardTitle>
          <CardDescription>This month's breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
            <p className="text-sm text-muted-foreground">
              {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>By Category</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryData.map((category) => {
            const percentage = calculatePercentage(category.totalAmount, totalAmount);
            const color = getCategoryColor(category.category);

            return (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {getCategoryIcon(category.category)}
                    </span>
                    <div>
                      <p className="font-medium text-sm">
                        {getCategoryLabel(category.category)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.count} transaction{category.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(category.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{percentage}%</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top Spending Days */}
      {topSpendingDays.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Top Spending Days</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {topSpendingDays.map((day, index) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold',
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-muted-foreground/10 text-muted-foreground'
                    )}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {day.count} transaction{day.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <p className="font-semibold">{formatCurrency(day.totalAmount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">💡 Insights</h4>
            {categoryData.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Your top spending category is{' '}
                <span className="font-medium text-foreground">
                  {getCategoryLabel(categoryData[0].category)}
                </span>{' '}
                at {formatCurrency(categoryData[0].totalAmount)} (
                {calculatePercentage(categoryData[0].totalAmount, totalAmount)}% of total spending)
              </p>
            )}
            {topSpendingDays.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Your highest spending day was{' '}
                <span className="font-medium text-foreground">
                  {new Date(topSpendingDays[0].date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>{' '}
                with {formatCurrency(topSpendingDays[0].totalAmount)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};