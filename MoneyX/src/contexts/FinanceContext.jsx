import React, { createContext, useCallback, useEffect, useState } from 'react';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getMonthKey, getPreviousMonthKey } from '@/lib/utils';
import { getBillOutstanding } from '@/lib/creditCard';

export const FinanceContext = createContext(null);

async function fetchBillOutstanding(userId, cardId, monthKey) {
    const billRef = doc(db, `users/${userId}/creditCards/${cardId}/bills/${monthKey}`);
    const billDoc = await getDoc(billRef);
    if (!billDoc.exists()) return 0;
    return getBillOutstanding(billDoc.data());
}

async function fetchLastMonthSavings(userId, currentMonthKey) {
    const previousMonthKey = getPreviousMonthKey(currentMonthKey);
    const prevMonthRef = doc(db, `users/${userId}/months/${previousMonthKey}`);
    const prevMonthDoc = await getDoc(prevMonthRef);

    if (!prevMonthDoc.exists()) return 0;

    const prevData = prevMonthDoc.data();
    if (!prevData.salaryReceived) return 0;

    return Math.max(0, prevData.calculations?.currentExpendables || 0);
}

export const FinanceProvider = ({ children }) => {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getFixedExpenses = useCallback(async () => {
        if (!user) return [];
        const q = query(
            collection(db, `users/${user.uid}/fixedExpenses`),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }, [user]);

    const getDPSAccounts = useCallback(async () => {
        if (!user) return [];
        const q = query(
            collection(db, `users/${user.uid}/dpsAccounts`),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }, [user]);

    const getCreditCards = useCallback(async () => {
        if (!user) return [];
        const q = query(
            collection(db, `users/${user.uid}/creditCards`),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }, [user]);

    const getFutureSavings = useCallback(async () => {
        if (!user) return [];
        const q = query(
            collection(db, `users/${user.uid}/futureSavings`),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }, [user]);

    const loadCurrentMonth = useCallback(async () => {
        if (!user) {
            setCurrentMonth(null);
            setLoading(false);
            return;
        }

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
                const lastMonthSavings = await fetchLastMonthSavings(user.uid, monthKey);

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
                        lastMonthSavings,
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
    }, [user]);

    useEffect(() => {
        loadCurrentMonth();
    }, [loadCurrentMonth]);

    const updateMonthCalculations = async (updates) => {
        if (!user || !currentMonth) return;

        const monthRef = doc(db, `users/${user.uid}/months/${currentMonth.id}`);
        await updateDoc(monthRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });

        await loadCurrentMonth();
    };

    const computeTotals = async (monthKey) => {
        const [fixedExpenses, dpsAccounts, creditCards, futureSavings] = await Promise.all([
            getFixedExpenses(),
            getDPSAccounts(),
            getCreditCards(),
            getFutureSavings(),
        ]);

        const totalFixedExpenses = fixedExpenses.reduce(
            (sum, exp) => sum + (exp.amount || 0),
            0
        );

        const totalDPS = dpsAccounts.reduce(
            (sum, dps) => sum + (dps.monthlyAmount || 0),
            0
        );

        const billAmounts = await Promise.all(
            creditCards.map(card => fetchBillOutstanding(user.uid, card.id, monthKey))
        );
        const totalCreditCardBills = billAmounts.reduce((sum, bill) => sum + bill, 0);

        const totalFutureSavings = futureSavings.reduce(
            (sum, saving) => sum + (saving.allocatedAmount || 0),
            0
        );

        return {
            totalFixedExpenses,
            totalDPS,
            totalCreditCardBills,
            totalFutureSavings,
        };
    };

    const rolloverCreditCardBills = async () => {
        if (!user) return;

        const currentMonthKey = getMonthKey();
        const previousMonthKey = getPreviousMonthKey(currentMonthKey);
        const creditCards = await getCreditCards();

        for (const card of creditCards) {
            const currentBillRef = doc(
                db,
                `users/${user.uid}/creditCards/${card.id}/bills/${currentMonthKey}`
            );
            const currentBillDoc = await getDoc(currentBillRef);

            if (currentBillDoc.exists()) continue;

            const previousBillRef = doc(
                db,
                `users/${user.uid}/creditCards/${card.id}/bills/${previousMonthKey}`
            );
            const previousBillDoc = await getDoc(previousBillRef);

            if (!previousBillDoc.exists()) continue;

            const previousBill = previousBillDoc.data();
            const remainingBalance = getBillOutstanding(previousBill);

            if (remainingBalance > 0) {
                await setDoc(currentBillRef, {
                    monthKey: currentMonthKey,
                    previousBill: remainingBalance,
                    thisMonthTransactions: 0,
                    totalPending: remainingBalance,
                    paidAmount: 0,
                    remainingBalance,
                    isPaidFull: false,
                    carriedForward: true,
                    carriedFromMonth: previousMonthKey,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
            }
        }
    };

    const setSalary = async (amount, { isUpdate = false } = {}) => {
        if (!user) throw new Error('User not authenticated');

        const monthKey = getMonthKey();
        const isFirstSalary = !currentMonth?.salaryReceived && !isUpdate;

        if (isFirstSalary) {
            await rolloverCreditCardBills();
        }

        const totals = await computeTotals(monthKey);
        const initialExpendables =
            amount - totals.totalFixedExpenses - totals.totalDPS - totals.totalCreditCardBills;

        const lastMonthSavings = isFirstSalary
            ? (currentMonth?.calculations?.lastMonthSavings ??
              (await fetchLastMonthSavings(user.uid, monthKey)))
            : (currentMonth?.calculations?.lastMonthSavings || 0);

        let currentExpendables = Math.max(0, initialExpendables);
        let reservedAmount = 0;

        if (isUpdate && currentMonth?.salaryReceived) {
            const prevInitial = currentMonth.calculations.initialExpendables || 0;
            const prevCurrent = currentMonth.calculations.currentExpendables || 0;
            const amountSpent = Math.max(0, prevInitial - prevCurrent);
            currentExpendables = Math.max(0, initialExpendables - amountSpent);
            reservedAmount = currentMonth.calculations.reservedAmount || 0;
        }

        await updateMonthCalculations({
            salaryReceived: true,
            salaryAmount: amount,
            salaryReceivedDate: Timestamp.now(),
            'calculations.totalFixedExpenses': totals.totalFixedExpenses,
            'calculations.totalDPSAmount': totals.totalDPS,
            'calculations.totalCreditCardBills': totals.totalCreditCardBills,
            'calculations.totalFutureSavings': totals.totalFutureSavings,
            'calculations.totalTemporaryExpenses': 0,
            'calculations.initialExpendables': Math.max(0, initialExpendables),
            'calculations.currentExpendables': currentExpendables,
            'calculations.reservedAmount': reservedAmount,
            'calculations.lastMonthSavings': lastMonthSavings,
        });
    };

    const recalculateExpendables = async () => {
        if (!user || !currentMonth || !currentMonth.salaryReceived) return;

        const monthKey = getMonthKey();
        const totals = await computeTotals(monthKey);
        const salaryAmount = currentMonth.salaryAmount;
        const initialExpendables =
            salaryAmount - totals.totalFixedExpenses - totals.totalDPS - totals.totalCreditCardBills;

        const prevInitial = currentMonth.calculations.initialExpendables || 0;
        const prevCurrent = currentMonth.calculations.currentExpendables || 0;
        const amountSpent = Math.max(0, prevInitial - prevCurrent);

        await updateMonthCalculations({
            'calculations.totalFixedExpenses': totals.totalFixedExpenses,
            'calculations.totalDPSAmount': totals.totalDPS,
            'calculations.totalCreditCardBills': totals.totalCreditCardBills,
            'calculations.totalFutureSavings': totals.totalFutureSavings,
            'calculations.initialExpendables': Math.max(0, initialExpendables),
            'calculations.currentExpendables': Math.max(0, initialExpendables - amountSpent),
        });
    };

    const value = {
        currentMonth,
        loading,
        error,
        setSalary,
        updateMonthCalculations,
        refreshMonth: loadCurrentMonth,
        recalculateExpendables,
        rolloverCreditCardBills,
    };

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
