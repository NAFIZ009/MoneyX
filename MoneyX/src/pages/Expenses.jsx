import React, { useState, useRef, useEffect } from 'react';
import { BottomNav } from '@/components/common/BottomNav';
import { Navbar } from '@/components/common/Navbar';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters';
import { CategoryBreakdown } from '@/components/expenses/CategoryBreakdown';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/useExpenses';
import { useFinance } from '@/hooks/useFinance';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Receipt, Info } from 'lucide-react';
import { QuickAddExpense } from '@/components/dashboard/QuickAddExpense';
import { cn } from '@/lib/utils';

export default function Expenses() {
  const { expenses, loading } = useExpenses();
  const { currentMonth } = useFinance();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: 'all',
    paymentMethod: 'all',
  });

  // Create refs for each section
  const listRef = useRef(null);
  const analyticsRef = useRef(null);

  // Scroll to section function
  const scrollToSection = (ref, tabValue) => {
    setActiveTab(tabValue);
    setTimeout(() => {
      ref.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 0);
  };

  // Observe which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            setActiveTab(id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-100px 0px -50% 0px' }
    );

    const sections = [listRef, analyticsRef];
    sections.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const hasSalary = currentMonth?.salaryReceived;

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar
        title="Expenses"
        actions={
          hasSalary ? (
            <Button
              size="icon"
              onClick={() => setShowAddExpense(true)}
              className="h-9 w-9"
            >
              <Plus className="h-5 w-5" />
            </Button>
          ) : null
        }
      />

      <main className="max-w-lg mx-auto">
        {!hasSalary && (
          <Alert className="m-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Salary Required</AlertTitle>
            <AlertDescription>
              Add your salary in Management before tracking expenses.
            </AlertDescription>
          </Alert>
        )}

        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Start tracking your expenses by adding your first transaction"
            action={
              hasSalary ? (
                <Button onClick={() => setShowAddExpense(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              ) : null
            }
            className="mt-20"
          />
        ) : (
          <>
            {/* Sticky Tab Navigation - Centered */}
            <div className="sticky top-14 z-20 bg-background border-b safe-top">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex justify-center p-2">
                  <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground gap-1">
                    <button
                      onClick={() => scrollToSection(listRef, 'list')}
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                        activeTab === 'list'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      )}
                    >
                      Transactions
                    </button>
                    <button
                      onClick={() => scrollToSection(analyticsRef, 'analytics')}
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                        activeTab === 'analytics'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      )}
                    >
                      Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* All Sections in One Scrollable Page */}
            <div>
              {/* Transactions Section */}
              <section ref={listRef} id="list" className="scroll-mt-28 p-4 space-y-4">
                <ExpenseFilters filters={filters} onFiltersChange={setFilters} />
                <ExpenseList filters={filters} />
              </section>

              {/* Analytics Section */}
              <section ref={analyticsRef} id="analytics" className="scroll-mt-28 p-4 border-t">
                <CategoryBreakdown />
              </section>
            </div>
          </>
        )}
      </main>

      {showAddExpense && (
        <QuickAddExpense open={showAddExpense} onOpenChange={setShowAddExpense} />
      )}

      <BottomNav />
    </div>
  );
}