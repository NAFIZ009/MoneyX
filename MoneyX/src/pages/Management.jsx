import React from 'react';
import { BottomNav } from '@/components/common/BottomNav';
import { Navbar } from '@/components/common/Navbar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SalaryManager } from '@/components/management/SalaryManager';
import { FixedExpenseManager } from '@/components/management/FixedExpenseManager';
import { DPSManager } from '@/components/management/DPSManager';
import { CreditCardManager } from '@/components/management/CreditCardManager';
import { FutureSavingsManager } from '@/components/management/FutureSavingsManager';

export default function Management() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar title="Management" />

      <main className="max-w-lg mx-auto">
        <Tabs defaultValue="salary" className="w-full">
          <div className="sticky top-14 z-20 bg-background border-b">
            <div className="overflow-x-auto">
              <TabsList className="w-full rounded-none h-12 inline-flex min-w-full">
                <TabsTrigger value="salary" className="flex-1">
                  Salary
                </TabsTrigger>
                <TabsTrigger value="expenses" className="flex-1">
                  Expenses
                </TabsTrigger>
                <TabsTrigger value="dps" className="flex-1">
                  DPS
                </TabsTrigger>
                <TabsTrigger value="cards" className="flex-1">
                  Cards
                </TabsTrigger>
                <TabsTrigger value="savings" className="flex-1">
                  Savings
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="salary" className="mt-0">
            <div className="p-4">
              <SalaryManager />
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="mt-0">
            <div className="p-4">
              <FixedExpenseManager />
            </div>
          </TabsContent>

          <TabsContent value="dps" className="mt-0">
            <div className="p-4">
              <DPSManager />
            </div>
          </TabsContent>

          <TabsContent value="cards" className="mt-0">
            <div className="p-4">
              <CreditCardManager />
            </div>
          </TabsContent>

          <TabsContent value="savings" className="mt-0">
            <div className="p-4">
              <FutureSavingsManager />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}