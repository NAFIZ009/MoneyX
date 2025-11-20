import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Wallet } from 'lucide-react';

export const StepComplete = ({ onComplete, summary }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">All Set! 🎉</h2>
        <p className="text-muted-foreground">
          Your financial profile has been created successfully
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Your Setup Summary</h3>
            
            {summary.salary && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Monthly Salary</span>
                <span className="font-medium">
                  {summary.salary.isFixed 
                    ? `৳${parseFloat(summary.salary.fixedAmount).toLocaleString()}`
                    : 'Variable'
                  }
                </span>
              </div>
            )}
            
            {summary.expenses && summary.expenses.length > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Fixed Expenses</span>
                <span className="font-medium">{summary.expenses.length} items</span>
              </div>
            )}
            
            {summary.dpsAccounts && summary.dpsAccounts.length > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">DPS Accounts</span>
                <span className="font-medium">{summary.dpsAccounts.length} accounts</span>
              </div>
            )}
            
            {summary.fdAccounts && summary.fdAccounts.length > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Fixed Deposits</span>
                <span className="font-medium">{summary.fdAccounts.length} accounts</span>
              </div>
            )}
            
            {summary.cards && summary.cards.length > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Credit Cards</span>
                <span className="font-medium">{summary.cards.length} cards</span>
              </div>
            )}
            
            {summary.savings && summary.savings.length > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Savings Goals</span>
                <span className="font-medium">{summary.savings.length} goals</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-primary/10 p-4 rounded-lg">
        <p className="text-sm text-center">
          💡 You can always update these details later from the Management section
        </p>
      </div>

      <Button onClick={onComplete} className="w-full" size="lg">
        <Wallet className="h-4 w-4 mr-2" />
        Go to Dashboard
      </Button>
    </div>
  );
};