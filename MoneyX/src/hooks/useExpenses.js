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
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useFinance } from './useFinance';
import { getMonthKey } from '@/lib/utils';

export const useExpenses = () => {
  const { user } = useAuth();
  const { currentMonth, updateMonthCalculations } = useFinance();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load expenses for current month
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
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setExpenses(expensesData);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      const monthKey = getMonthKey();

      const newExpense = {
        name: expenseData.name,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category || 'others',
        date: Timestamp.fromDate(now),
        monthKey,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        paymentMethod: {
          type: expenseData.fromCreditCard ? 'creditCard' : 'cash',
          creditCardId: expenseData.creditCardId || null,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Add expense to Firestore
      const docRef = await addDoc(
        collection(db, `users/${user.uid}/dailyExpenses`),
        newExpense
      );

      // Update month calculations
      if (expenseData.fromCreditCard) {
        // Reserve amount from expendables and update credit card bill
        await Promise.all([
          updateMonthCalculations({
            'calculations.reservedAmount': increment(newExpense.amount),
            'calculations.currentExpendables': increment(-newExpense.amount),
          }),
          updateDoc(
            doc(db, `users/${user.uid}/creditCards/${expenseData.creditCardId}/bills/${monthKey}`),
            {
              thisMonthTransactions: increment(newExpense.amount),
              totalPending: increment(newExpense.amount),
              updatedAt: Timestamp.now(),
            }
          ),
        ]);
      } else {
        // Deduct from expendables
        await updateMonthCalculations({
          'calculations.currentExpendables': increment(-newExpense.amount),
          'statistics.totalDailyExpenses': increment(newExpense.amount),
          'statistics.expenseCount': increment(1),
        });
      }

      // Reload expenses
      await loadExpenses();

      return { id: docRef.id, ...newExpense };
    } catch (err) {
      console.error('Error adding expense:', err);
      throw err;
    }
  };

  const updateExpense = async (expenseId, updates) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const expenseRef = doc(db, `users/${user.uid}/dailyExpenses/${expenseId}`);
      await updateDoc(expenseRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      await loadExpenses();
    } catch (err) {
      console.error('Error updating expense:', err);
      throw err;
    }
  };

  const deleteExpense = async (expenseId) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Get expense data first
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) throw new Error('Expense not found');

      // Delete expense
      await deleteDoc(doc(db, `users/${user.uid}/dailyExpenses/${expenseId}`));

      // Update calculations (reverse the deductions)
      if (expense.paymentMethod.type === 'creditCard') {
        await updateMonthCalculations({
          'calculations.reservedAmount': increment(-expense.amount),
          'calculations.currentExpendables': increment(expense.amount),
        });
      } else {
        await updateMonthCalculations({
          'calculations.currentExpendables': increment(expense.amount),
          'statistics.totalDailyExpenses': increment(-expense.amount),
          'statistics.expenseCount': increment(-1),
        });
      }

      await loadExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      throw err;
    }
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