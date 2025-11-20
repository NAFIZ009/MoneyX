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
            const [fixedExpenses, dpsAccounts, creditCards] = await Promise.all([
                getFixedExpenses(),
                getDPSAccounts(),
                getCreditCards(),
            ]);

            // Calculate Fixed Expenses total (only active ones)
            const totalFixedExpenses = fixedExpenses
                .filter(exp => exp.isActive)
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);

            // Calculate DPS total (only active ones)
            const totalDPS = dpsAccounts
                .filter(dps => dps.isActive)
                .reduce((sum, dps) => sum + (dps.monthlyAmount || 0), 0);

            // Get credit card bills for current month
            const monthKey = getMonthKey();
            const creditCardBills = await Promise.all(
                creditCards
                    .filter(card => card.isActive)
                    .map(async (card) => {
                        const billRef = doc(db, `users/${user.uid}/creditCards/${card.id}/bills/${monthKey}`);
                        const billDoc = await getDoc(billRef);

                        if (billDoc.exists()) {
                            const billData = billDoc.data();
                            return billData.totalPending || 0;
                        }
                        return 0;
                    })
            );

            const totalCreditCardBills = creditCardBills.reduce((sum, bill) => sum + bill, 0);

            // CORRECT FORMULA: Salary - (Fixed Expenses + DPS + Credit Card Bills)
            const initialExpendables = amount - totalFixedExpenses - totalDPS - totalCreditCardBills;

            // Get last month savings (TODO: implement if needed)
            const lastMonthSavings = 0;

            // Update month with ALL calculation details
            await updateMonthCalculations({
                salaryReceived: true,
                salaryAmount: amount,
                salaryReceivedDate: Timestamp.now(),
                'calculations.totalFixedExpenses': totalFixedExpenses,
                'calculations.totalDPSAmount': totalDPS,
                'calculations.totalCreditCardBills': totalCreditCardBills,
                'calculations.totalFutureSavings': 0, // Not deducted from expendables
                'calculations.totalTemporaryExpenses': 0, // Not deducted from expendables
                'calculations.initialExpendables': Math.max(0, initialExpendables),
                'calculations.currentExpendables': Math.max(0, initialExpendables),
                'calculations.reservedAmount': 0, // Reset reserved amount
                'calculations.lastMonthSavings': lastMonthSavings,
            });

            console.log('✅ Salary calculation:', {
                salary: amount,
                fixedExpenses: totalFixedExpenses,
                dps: totalDPS,
                creditCards: totalCreditCardBills,
                initialExpendables: Math.max(0, initialExpendables),
            });

        } catch (err) {
            console.error('❌ Error setting salary:', err);
            throw err;
        }
    };

    const recalculateExpendables = async () => {
        try {
            if (!user || !currentMonth || !currentMonth.salaryReceived) {
                console.log('⚠️ Cannot recalculate: No salary set yet');
                return;
            }

            console.log('🔄 Recalculating expendables...');

            // Fetch all necessary data for calculation
            const [fixedExpenses, dpsAccounts, creditCards] = await Promise.all([
                getFixedExpenses(),
                getDPSAccounts(),
                getCreditCards(),
            ]);

            // Calculate Fixed Expenses total (only active ones)
            const totalFixedExpenses = fixedExpenses
                .filter(exp => exp.isActive)
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);

            // Calculate DPS total (only active ones)
            const totalDPS = dpsAccounts
                .filter(dps => dps.isActive)
                .reduce((sum, dps) => sum + (dps.monthlyAmount || 0), 0);

            // Get credit card bills for current month
            const monthKey = getMonthKey();
            const creditCardBills = await Promise.all(
                creditCards
                    .filter(card => card.isActive)
                    .map(async (card) => {
                        const billRef = doc(db, `users/${user.uid}/creditCards/${card.id}/bills/${monthKey}`);
                        const billDoc = await getDoc(billRef);

                        if (billDoc.exists()) {
                            const billData = billDoc.data();
                            return billData.totalPending || 0;
                        }
                        return 0;
                    })
            );

            const totalCreditCardBills = creditCardBills.reduce((sum, bill) => sum + bill, 0);

            // Calculate using EXISTING salary amount
            const salaryAmount = currentMonth.salaryAmount;
            const initialExpendables = salaryAmount - totalFixedExpenses - totalDPS - totalCreditCardBills;

            // Calculate how much has been spent already
            const currentSpent = currentMonth.calculations.initialExpendables - currentMonth.calculations.currentExpendables;

            // Update month calculations while preserving current expendables properly
            await updateMonthCalculations({
                'calculations.totalFixedExpenses': totalFixedExpenses,
                'calculations.totalDPSAmount': totalDPS,
                'calculations.totalCreditCardBills': totalCreditCardBills,
                'calculations.initialExpendables': Math.max(0, initialExpendables),
                'calculations.currentExpendables': Math.max(0, initialExpendables - currentSpent),
            });

            console.log('✅ Recalculation complete:', {
                salary: salaryAmount,
                fixedExpenses: totalFixedExpenses,
                dps: totalDPS,
                creditCards: totalCreditCardBills,
                initialExpendables: Math.max(0, initialExpendables),
                currentExpendables: Math.max(0, initialExpendables - currentSpent),
            });

        } catch (err) {
            console.error('❌ Error recalculating expendables:', err);
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
        recalculateExpendables
    };

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};