import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  setDoc,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useFinance } from './useFinance';
import { getMonthKey } from '@/lib/utils';
import { getBillOutstanding } from '@/lib/creditCard';

async function upsertCreditCardBillCharge(userId, creditCardId, monthKey, amount) {
  const billRef = doc(
    db,
    `users/${userId}/creditCards/${creditCardId}/bills/${monthKey}`
  );
  const billDoc = await getDoc(billRef);

  if (billDoc.exists()) {
    const bill = billDoc.data();
    const newTotalPending = (bill.totalPending || 0) + amount;
    const newThisMonth = (bill.thisMonthTransactions || 0) + amount;
    const newRemaining = getBillOutstanding(bill) + amount;

    await updateDoc(billRef, {
      thisMonthTransactions: newThisMonth,
      totalPending: newTotalPending,
      remainingBalance: newRemaining,
      isPaidFull: false,
      updatedAt: Timestamp.now(),
    });
  } else {
    await setDoc(billRef, {
      monthKey,
      previousBill: 0,
      thisMonthTransactions: amount,
      totalPending: amount,
      paidAmount: 0,
      remainingBalance: amount,
      isPaidFull: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

async function reverseCreditCardBillCharge(userId, creditCardId, monthKey, amount) {
  const billRef = doc(
    db,
    `users/${userId}/creditCards/${creditCardId}/bills/${monthKey}`
  );
  const billDoc = await getDoc(billRef);
  if (!billDoc.exists()) return;

  const bill = billDoc.data();
  const newTotalPending = Math.max(0, (bill.totalPending || 0) - amount);
  const newThisMonth = Math.max(0, (bill.thisMonthTransactions || 0) - amount);
  const newRemaining = Math.max(0, getBillOutstanding(bill) - amount);

  await updateDoc(billRef, {
    thisMonthTransactions: newThisMonth,
    totalPending: newTotalPending,
    remainingBalance: newRemaining,
    isPaidFull: newRemaining === 0,
    updatedAt: Timestamp.now(),
  });
}

export const useExpenses = () => {
  const { user } = useAuth();
  const { currentMonth, updateMonthCalculations, recalculateExpendables } = useFinance();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !currentMonth) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    loadExpenses();
  }, [user, currentMonth]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const monthKey = getMonthKey();
      const q = query(
        collection(db, `users/${user.uid}/dailyExpenses`),
        where('monthKey', '==', monthKey),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      setExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData) => {
    if (!user) throw new Error('User not authenticated');

    const expenseDate = expenseData.date
      ? new Date(expenseData.date + 'T12:00:00')
      : new Date();

    const monthKey = getMonthKey(expenseDate);
    const currentMonthKey = getMonthKey();

    if (monthKey !== currentMonthKey) {
      throw new Error('Expenses can only be added for the current month');
    }

    if (!currentMonth?.salaryReceived) {
      throw new Error('Please add your salary before tracking expenses');
    }

    const newExpense = {
      name: expenseData.name,
      amount: parseFloat(expenseData.amount),
      category: expenseData.category || 'others',
      date: Timestamp.fromDate(expenseDate),
      monthKey,
      year: expenseDate.getFullYear(),
      month: expenseDate.getMonth() + 1,
      day: expenseDate.getDate(),
      paymentMethod: {
        type: expenseData.fromCreditCard ? 'creditCard' : 'cash',
        creditCardId: expenseData.creditCardId || null,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(db, `users/${user.uid}/dailyExpenses`),
      newExpense
    );

    if (expenseData.fromCreditCard) {
      await Promise.all([
        updateMonthCalculations({
          'calculations.reservedAmount': increment(newExpense.amount),
          'calculations.currentExpendables': increment(-newExpense.amount),
        }),
        upsertCreditCardBillCharge(
          user.uid,
          expenseData.creditCardId,
          monthKey,
          newExpense.amount
        ),
      ]);
    } else {
      await updateMonthCalculations({
        'calculations.currentExpendables': increment(-newExpense.amount),
        'statistics.totalDailyExpenses': increment(newExpense.amount),
        'statistics.expenseCount': increment(1),
      });
    }

    await loadExpenses();
    return { id: docRef.id, ...newExpense };
  };

  const updateExpense = async (expenseId, updates) => {
    if (!user) throw new Error('User not authenticated');

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) throw new Error('Expense not found');

    const newAmount = updates.amount != null ? parseFloat(updates.amount) : expense.amount;
    const newName = updates.name ?? expense.name;
    const newCategory = updates.category ?? expense.category;
    const amountDiff = newAmount - expense.amount;
    const currentMonthKey = getMonthKey();

    await updateDoc(doc(db, `users/${user.uid}/dailyExpenses/${expenseId}`), {
      name: newName,
      amount: newAmount,
      category: newCategory,
      updatedAt: Timestamp.now(),
    });

    if (expense.monthKey === currentMonthKey && amountDiff !== 0) {
      if (expense.paymentMethod?.type === 'creditCard' && expense.paymentMethod.creditCardId) {
        await Promise.all([
          updateMonthCalculations({
            'calculations.reservedAmount': increment(amountDiff),
            'calculations.currentExpendables': increment(-amountDiff),
          }),
          amountDiff > 0
            ? upsertCreditCardBillCharge(
                user.uid,
                expense.paymentMethod.creditCardId,
                expense.monthKey,
                amountDiff
              )
            : reverseCreditCardBillCharge(
                user.uid,
                expense.paymentMethod.creditCardId,
                expense.monthKey,
                Math.abs(amountDiff)
              ),
        ]);
      } else {
        await updateMonthCalculations({
          'calculations.currentExpendables': increment(-amountDiff),
          'statistics.totalDailyExpenses': increment(amountDiff),
        });
      }
    }

    await loadExpenses();
  };

  const deleteExpense = async (expenseId) => {
    if (!user) throw new Error('User not authenticated');

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) throw new Error('Expense not found');

    await deleteDoc(doc(db, `users/${user.uid}/dailyExpenses/${expenseId}`));

    const currentMonthKey = getMonthKey();
    if (expense.monthKey === currentMonthKey) {
      if (expense.paymentMethod?.type === 'creditCard' && expense.paymentMethod.creditCardId) {
        await Promise.all([
          updateMonthCalculations({
            'calculations.reservedAmount': increment(-expense.amount),
            'calculations.currentExpendables': increment(expense.amount),
          }),
          reverseCreditCardBillCharge(
            user.uid,
            expense.paymentMethod.creditCardId,
            expense.monthKey,
            expense.amount
          ),
          recalculateExpendables(),
        ]);
      } else {
        await updateMonthCalculations({
          'calculations.currentExpendables': increment(expense.amount),
          'statistics.totalDailyExpenses': increment(-expense.amount),
          'statistics.expenseCount': increment(-1),
        });
      }
    }

    await loadExpenses();
  };

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses: loadExpenses,
  };
};
