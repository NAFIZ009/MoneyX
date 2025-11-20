import React, { useState } from 'react';
import { BottomNav } from '@/components/common/BottomNav';
import { Navbar } from '@/components/common/Navbar';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters';
import { CategoryBreakdown } from '@/components/expenses/CategoryBreakdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/useExpenses';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Plus, Receipt } from 'lucide-react';
import { QuickAddExpense } from '@/components/dashboard/QuickAddExpense';

export default function Expenses() {
  const { expenses, loading } = useExpenses();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: 'all',
    paymentMethod: 'all',
  });

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar
        title="Expenses"
        actions={
          <Button
            size="icon"
            onClick={() => setShowAddExpense(true)}
            className="h-9 w-9"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <main className="max-w-lg mx-auto">
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Start tracking your expenses by adding your first transaction"
            action={
              <Button onClick={() => setShowAddExpense(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            }
            className="mt-20"
          />
        ) : (
          <Tabs defaultValue="list" className="w-full">
            <div className="sticky top-14 z-20 bg-background border-b">
              <TabsList className="w-full rounded-none h-12">
                <TabsTrigger value="list" className="flex-1">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1">
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="mt-0">
              <div className="p-4 space-y-4">
                <ExpenseFilters filters={filters} onFiltersChange={setFilters} />
                <ExpenseList filters={filters} />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="p-4">
                <CategoryBreakdown />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {showAddExpense && (
        <QuickAddExpense open={showAddExpense} onOpenChange={setShowAddExpense} />
      )}

      <BottomNav />
    </div>
  );
}