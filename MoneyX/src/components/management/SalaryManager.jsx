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
                                expenses, DPS, and credit card bills.
                            </AlertDescription>
                        </Alert>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Processing...' : hasSalary ? 'Update Salary' : 'Add Salary'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Calculation Breakdown - FIXED VERSION */}
            {hasSalary && currentMonth?.calculations && (
                <Card>
                    <CardHeader>
                        <CardTitle>Calculation Breakdown</CardTitle>
                        <CardDescription>How your expendables are calculated</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {/* Salary - Always shown */}
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Salary</span>
                            <span className="font-medium text-green-600">
                                {formatCurrency(currentMonth.salaryAmount)}
                            </span>
                        </div>

                        {/* Fixed Expenses - Always shown (even if 0) */}
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Fixed Expenses</span>
                            <span className={`font-medium ${currentMonth.calculations.totalFixedExpenses > 0 ? 'text-destructive' : 'text-muted-foreground/50'}`}>
                                -{formatCurrency(currentMonth.calculations.totalFixedExpenses)}
                            </span>
                        </div>

                        {/* DPS - Always shown (even if 0) */}
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">DPS</span>
                            <span className={`font-medium ${currentMonth.calculations.totalDPSAmount > 0 ? 'text-destructive' : 'text-muted-foreground/50'}`}>
                                -{formatCurrency(currentMonth.calculations.totalDPSAmount)}
                            </span>
                        </div>

                        {/* Credit Card Bills - Always shown (even if 0) */}
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Credit Card Bills</span>
                            <span className={`font-medium ${currentMonth.calculations.totalCreditCardBills > 0 ? 'text-destructive' : 'text-muted-foreground/50'}`}>
                                -{formatCurrency(currentMonth.calculations.totalCreditCardBills)}
                            </span>
                        </div>

                        {/* Future Savings - Optional, grayed out (NOT DEDUCTED) */}
                        {currentMonth.calculations.totalFutureSavings > 0 && (
                            <div className="flex justify-between py-2 border-b opacity-50">
                                <span className="text-muted-foreground text-sm">
                                    Future Savings (not deducted)
                                </span>
                                <span className="font-medium text-sm">
                                    {formatCurrency(currentMonth.calculations.totalFutureSavings)}
                                </span>
                            </div>
                        )}

                        {/* Initial Expendables - Result */}
                        <div className="flex justify-between py-3 border-t-2 text-lg font-bold">
                            <span>Initial Expendables</span>
                            <span className="text-primary">
                                ={formatCurrency(currentMonth.calculations.initialExpendables)}
                            </span>
                        </div>

                        {/* Formula Display */}
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-xs font-mono text-muted-foreground text-center">
                                Expendables = Salary - (Fixed Expenses + DPS + Credit Card Bills)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};