import React, { useState, useRef, useEffect } from 'react';
import { BottomNav } from '@/components/common/BottomNav';
import { Navbar } from '@/components/common/Navbar';
import { PersonalLoanManager } from '@/components/debts/PersonalLoanManager';
import { MoneyLentManager } from '@/components/debts/MoneyLentManager';
import { EMIManager } from '@/components/debts/EMIManager';
import { cn } from '@/lib/utils';

export default function Debts() {
  const [activeTab, setActiveTab] = useState('loans');
  
  // Create refs for each section
  const loansRef = useRef(null);
  const lentRef = useRef(null);
  const emisRef = useRef(null);

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

    const sections = [loansRef, lentRef, emisRef];
    sections.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar title="Debt Management" />

      {/* Sticky Tab Navigation */}
      <div className="sticky top-14 z-20 bg-background border-b safe-top">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex justify-center p-2">
            <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground gap-1">
              <button
                onClick={() => scrollToSection(loansRef, 'loans')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeTab === 'loans'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                Loans
              </button>
              <button
                onClick={() => scrollToSection(lentRef, 'lent')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeTab === 'lent'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                Lent
              </button>
              <button
                onClick={() => scrollToSection(emisRef, 'emis')}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeTab === 'emis'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                EMIs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All Sections in One Scrollable Page */}
      <main className="max-w-lg mx-auto">
        {/* Personal Loans Section */}
        <section ref={loansRef} id="loans" className="scroll-mt-28 p-4">
          <PersonalLoanManager />
        </section>

        {/* Money Lent Section */}
        <section ref={lentRef} id="lent" className="scroll-mt-28 p-4 border-t">
          <MoneyLentManager />
        </section>

        {/* EMIs Section */}
        <section ref={emisRef} id="emis" className="scroll-mt-28 p-4 border-t">
          <EMIManager />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}