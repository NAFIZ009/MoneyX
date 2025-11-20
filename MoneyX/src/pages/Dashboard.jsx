import React, { useState } from 'react';
import { BottomNav } from '@/components/common/BottomNav';
import { Navbar } from '@/components/common/Navbar';
import { useFinance } from '@/hooks/useFinance';
import { useAuth } from '@/hooks/useAuth';
import { ExpenditureCard } from '@/components/dashboard/ExpenditureCard';
import { QuickAddExpense } from '@/components/dashboard/QuickAddExpense';
import { MonthlyObligations } from '@/components/dashboard/MonthlyObligations';
import { CreditCardSummary } from '@/components/dashboard/CreditCardSummary';
import { LastMonthSavings } from '@/components/dashboard/LastMonthSavings';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Plus } from 'lucide-react';
import { getMonthName, getMonthKey } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { currentMonth, loading } = useFinance();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  if (loading) {
    return <PageLoader />;
  }

  const hasSalary = currentMonth?.salaryReceived;
  const monthName = getMonthName(getMonthKey());

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar 
        title={`Hi, ${user?.displayName?.split(' ')[0] || 'there'}! 👋`}
      />
      
      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Month Header */}
        <div className="text-center py-2">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {monthName}
          </h2>
        </div>

        {/* Salary Not Received Alert */}
        {!hasSalary && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Setup Required</AlertTitle>
            <AlertDescription>
              Add your salary for this month to start tracking expenses.
              <Button 
                variant="link" 
                className="px-0 h-auto font-semibold"
                onClick={() => window.location.href = '/management'}
              >
                Add Salary →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Expenditure Card */}
        <ExpenditureCard />

        {/* Quick Add Button (Floating) */}
        {hasSalary && (
          <Button
            onClick={() => setShowQuickAdd(true)}
            size="lg"
            className="w-full shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Quick Add Expense
          </Button>
        )}

        {/* Last Month Savings */}
        {currentMonth?.calculations?.lastMonthSavings > 0 && (
          <LastMonthSavings amount={currentMonth.calculations.lastMonthSavings} />
        )}

        {/* Monthly Obligations */}
        {hasSalary && <MonthlyObligations />}

        {/* Credit Card Summary */}
        {hasSalary && <CreditCardSummary />}
      </main>

      {/* Quick Add Expense Dialog */}
      {showQuickAdd && (
        <QuickAddExpense
          open={showQuickAdd}
          onOpenChange={setShowQuickAdd}
        />
      )}

      <BottomNav />
    </div>
  );
}