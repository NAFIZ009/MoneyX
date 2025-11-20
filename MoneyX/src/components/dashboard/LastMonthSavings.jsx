import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

export const LastMonthSavings = ({ amount }) => {
  if (!amount || amount <= 0) {
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Last Month Savings
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(amount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};