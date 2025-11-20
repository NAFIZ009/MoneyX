import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { useFinance } from '@/hooks/useFinance';
import { useToast } from '@/components/common/Toast';
import { formatCurrency, getMonthName, getMonthKey } from '@/lib/utils';
import { Banknote, CheckCircle, AlertCircle } from 'lucide-react';

export const SalaryManager = () => {
  const { currentMonth, setSalary } = useFinance();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const hasSalary = currentMonth?.salaryReceived;
  const currentSalary = currentMonth?.salaryAmount || 0;
  const monthName = getMonthName(getMonthKey());

  const handleAddSalary = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    try {
      setLoading(true);
      await setSalary(parseFloat(amount));
      toast.success('Salary added successfully!');
      setAmount('');
    } catch (error) {
      console.error('Error adding salary:', error);
      toast.error('Failed to add salary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Status */}
      {hasSalary ? (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Salary Received</AlertTitle>
          <AlertDescription>
            You've added {formatCurrency(currentSalary)} for {monthName}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Salary Added</AlertTitle>
          <AlertDescription>
            Add your salary for {monthName} to start tracking expenses
          </AlertDescription>
        </Alert>
      )}

      {/* Add Salary Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{hasSalary ? 'Update' : 'Add'} Salary</CardTitle>
              <CardDescription>
                {hasSalary ? 'Update your salary for' : 'Enter your salary for'} {monthName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSalary} className="space-y-4">
            <CurrencyInput
              label="Salary Amount"
              placeholder="0"
              value={amount}
              onChange={setAmount}
              disabled={loading}
            />

            <Alert>
              <AlertDescription className="text-xs">
                💡 Your expendables will be calculated automatically after deducting fixed
                expenses, DPS, credit card bills, and savings goals.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : hasSalary ? 'Update Salary' : 'Add Salary'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Calculation Breakdown */}
      {hasSalary && currentMonth?.calculations && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Breakdown</CardTitle>
            <CardDescription>How your expendables are calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Salary</span>
              <span className="font-medium">
                {formatCurrency(currentMonth.salaryAmount)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b text-destructive">
              <span>Fixed Expenses</span>
              <span>-{formatCurrency(currentMonth.calculations.totalFixedExpenses)}</span>
            </div>
            <div className="flex justify-between py-2 border-b text-destructive">
              <span>DPS</span>
              <span>-{formatCurrency(currentMonth.calculations.totalDPSAmount)}</span>
            </div>
            <div className="flex justify-between py-2 border-b text-destructive">
              <span>Credit Card Bills</span>
              <span>-{formatCurrency(currentMonth.calculations.totalCreditCardBills)}</span>
            </div>
            <div className="flex justify-between py-2 border-b text-destructive">
              <span>Future Savings</span>
              <span>-{formatCurrency(currentMonth.calculations.totalFutureSavings)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 text-lg font-bold">
              <span>Initial Expendables</span>
              <span className="text-primary">
                {formatCurrency(currentMonth.calculations.initialExpendables)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};