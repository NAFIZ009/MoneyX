import React, { useRef, useState, useEffect } from 'react';
import { BottomNav } from '@/components/common/BottomNav';
import { Navbar } from '@/components/common/Navbar';
import { SalaryManager } from '@/components/management/SalaryManager';
import { FixedExpenseManager } from '@/components/management/FixedExpenseManager';
import { DPSManager } from '@/components/management/DPSManager';
import { FDManager } from '@/components/management/FDManager';
import { CreditCardManager } from '@/components/management/CreditCardManager';
import { FutureSavingsManager } from '@/components/management/FutureSavingsManager';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'salary', label: 'Salary' },
  { id: 'expenses', label: 'Fixed' },
  { id: 'dps', label: 'DPS' },
  { id: 'fd', label: 'FD' },
  { id: 'cards', label: 'Cards' },
  { id: 'savings', label: 'Savings' },
];

export default function Management() {
  const [activeTab, setActiveTab] = useState('salary');
  const refs = {
    salary: useRef(null),
    expenses: useRef(null),
    dps: useRef(null),
    fd: useRef(null),
    cards: useRef(null),
    savings: useRef(null),
  };

  const scrollToSection = (ref, tabValue) => {
    setActiveTab(tabValue);
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id) setActiveTab(id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-100px 0px -50% 0px' }
    );

    Object.values(refs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar title="Management" />

      <div className="sticky top-14 z-20 bg-background border-b safe-top">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex p-2 gap-1 min-w-max mx-auto max-w-lg">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(refs[tab.id], tab.id)}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto">
        <section ref={refs.salary} id="salary" className="scroll-mt-28 p-4">
          <SalaryManager />
        </section>
        <section ref={refs.expenses} id="expenses" className="scroll-mt-28 p-4 border-t">
          <FixedExpenseManager />
        </section>
        <section ref={refs.dps} id="dps" className="scroll-mt-28 p-4 border-t">
          <DPSManager />
        </section>
        <section ref={refs.fd} id="fd" className="scroll-mt-28 p-4 border-t">
          <FDManager />
        </section>
        <section ref={refs.cards} id="cards" className="scroll-mt-28 p-4 border-t">
          <CreditCardManager />
        </section>
        <section ref={refs.savings} id="savings" className="scroll-mt-28 p-4 border-t">
          <FutureSavingsManager />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
