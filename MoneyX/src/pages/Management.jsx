import React, { useRef, useState, useEffect } from 'react';
import { BottomNav } from '@/components/common/BottomNav';
import { Navbar } from '@/components/common/Navbar';
import { SalaryManager } from '@/components/management/SalaryManager';
import { FixedExpenseManager } from '@/components/management/FixedExpenseManager';
import { DPSManager } from '@/components/management/DPSManager';
import { CreditCardManager } from '@/components/management/CreditCardManager';
import { FutureSavingsManager } from '@/components/management/FutureSavingsManager';
import { cn } from '@/lib/utils';

export default function Management() {
  const [activeTab, setActiveTab] = useState('salary');
  
  // Create refs for each section
  const salaryRef = useRef(null);
  const expensesRef = useRef(null);
  const dpsRef = useRef(null);
  const cardsRef = useRef(null);
  const savingsRef = useRef(null);

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

    const sections = [salaryRef, expensesRef, dpsRef, cardsRef, savingsRef];
    sections.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar title="Management" />

      {/* Sticky Tab Navigation - Centered for mobile */}
      <div className="sticky top-14 z-20 bg-background border-b safe-top">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex justify-center p-2">
            <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground gap-1">
              <button
                onClick={() => scrollToSection(salaryRef, 'salary')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeTab === 'salary'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                Salary
              </button>
              <button
                onClick={() => scrollToSection(expensesRef, 'expenses')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeTab === 'expenses'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                Expenses
              </button>
              <button
                onClick={() => scrollToSection(dpsRef, 'dps')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeTab === 'dps'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                DPS
              </button>
              <button
                onClick={() => scrollToSection(cardsRef, 'cards')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeTab === 'cards'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                Cards
              </button>
              <button
                onClick={() => scrollToSection(savingsRef, 'savings')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeTab === 'savings'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                Savings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All Sections in One Scrollable Page */}
      <main className="max-w-lg mx-auto">
        {/* Salary Section */}
        <section ref={salaryRef} id="salary" className="scroll-mt-28 p-4">
          <SalaryManager />
        </section>

        {/* Fixed Expenses Section */}
        <section ref={expensesRef} id="expenses" className="scroll-mt-28 p-4 border-t">
          <FixedExpenseManager />
        </section>

        {/* DPS Section */}
        <section ref={dpsRef} id="dps" className="scroll-mt-28 p-4 border-t">
          <DPSManager />
        </section>

        {/* Credit Cards Section */}
        <section ref={cardsRef} id="cards" className="scroll-mt-28 p-4 border-t">
          <CreditCardManager />
        </section>

        {/* Future Savings Section */}
        <section ref={savingsRef} id="savings" className="scroll-mt-28 p-4 border-t">
          <FutureSavingsManager />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}