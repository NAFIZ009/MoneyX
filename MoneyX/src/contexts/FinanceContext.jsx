import React, { createContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getMonthKey } from '@/lib/utils';
import { calculateInitialExpendables } from '@/lib/calculations';

export const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load current month data
  useEffect(() => {
    if (!user) {
      setCurrentMonth(null);
      setLoading(false);
      return;
    }

    loadCurrentMonth();
  }, [user]);

  const loadCurrentMonth = async () => {
    try {
      setLoading(true);
      setError(null);

      const monthKey = getMonthKey();
      const monthRef = doc(db, `users/${user.uid}/months/${monthKey}`);
      const monthDoc = await getDoc(monthRef);

      if (monthDoc.exists()) {
        setCurrentMonth({
          id: monthDoc.id,
          ...monthDoc.data(),
        });
      } else {
        // Create new month document
        const newMonth = {
          monthKey,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          salaryReceived: false,
          salaryAmount: 0,
          salaryReceivedDate: null,
          calculations: {
            totalFixedExpenses: 0,
            totalDPSAmount: 0,
            totalCreditCardBills: 0,
            totalFutureSavings: 0,
            totalTemporaryExpenses: 0,
            initialExpendables: 0,
            reservedAmount: 0,
            currentExpendables: 0,
            lastMonthSavings: 0,
          },
          statistics: {
            totalDailyExpenses: 0,
            expenseCount: 0,
            topCategory: null,
            savingsRate: 0,
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await setDoc(monthRef, newMonth);
        setCurrentMonth({ id: monthKey, ...newMonth });
      }
    } catch (err) {
      console.error('Error loading current month:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMonthCalculations = async (updates) => {
    try {
      if (!user || !currentMonth) return;

      const monthRef = doc(db, `users/${user.uid}/months/${currentMonth.id}`);
      await updateDoc(monthRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      // Reload month data
      await loadCurrentMonth();
    } catch (err) {
      console.error('Error updating month calculations:', err);
      throw err;
    }
  };

  const setSalary = async (amount) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Fetch all necessary data for calculation
      const [fixedExpenses, dpsAccounts, creditCards, futureSavings] = await Promise.all([
        getFixedExpenses(),
        getDPSAccounts(),
        getCreditCards(),
        getFutureSavings(),
      ]);

      // Get credit card bills for current month
      const creditCardBills = await Promise.all(
        creditCards.map(async (card) => {
          const billRef = doc(db, `users/${user.uid}/creditCards/${card.id}/bills/${currentMonth.id}`);
          const billDoc = await getDoc(billRef);
          return billDoc.exists() ? billDoc.data() : { totalPending: 0 };
        })
      );

      // Calculate expendables
      const calculations = calculateInitialExpendables({
        salaryAmount: amount,
        fixedExpenses,
        dpsAccounts,
        creditCardBills,
        futureSavings,
        temporaryExpenses: [], // Will be added later
      });

      // Get last month savings
      const lastMonthSavings = 0; // TODO: Implement actual calculation

      await updateMonthCalculations({
        salaryReceived: true,
        salaryAmount: amount,
        salaryReceivedDate: Timestamp.now(),
        'calculations.totalFixedExpenses': calculations.totalFixedExpenses,
        'calculations.totalDPSAmount': calculations.totalDPS,
        'calculations.totalCreditCardBills': calculations.totalCreditCardBills,
        'calculations.totalFutureSavings': calculations.totalFutureSavings,
        'calculations.initialExpendables': calculations.initialExpendables,
        'calculations.currentExpendables': calculations.initialExpendables,
        'calculations.lastMonthSavings': lastMonthSavings,
      });
    } catch (err) {
      console.error('Error setting salary:', err);
      throw err;
    }
  };

  // Helper functions to fetch data
  const getFixedExpenses = async () => {
    if (!user) return [];
    const q = query(
      collection(db, `users/${user.uid}/fixedExpenses`),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const getDPSAccounts = async () => {
    if (!user) return [];
    const q = query(
      collection(db, `users/${user.uid}/dpsAccounts`),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const getCreditCards = async () => {
    if (!user) return [];
    const q = query(
      collection(db, `users/${user.uid}/creditCards`),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const getFutureSavings = async () => {
    if (!user) return [];
    const q = query(
      collection(db, `users/${user.uid}/futureSavings`),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const value = {
    currentMonth,
    loading,
    error,
    setSalary,
    updateMonthCalculations,
    refreshMonth: loadCurrentMonth,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};