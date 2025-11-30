import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import {
  calculateLoanEMI,
  calculateRemainingBalance,
  calculateCompletionPercentage,
  calculateNextDueDate,
} from '@/lib/debtCalculations';

export const useEMIs = () => {
  const { user } = useAuth();
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setEmis([]);
      setLoading(false);
      return;
    }

    loadEMIs();
  }, [user]);

  const loadEMIs = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, `users/${user.uid}/emis`),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const emisData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Calculate derived values
        const totalPrice = data.totalPrice;
        const downPayment = data.downPayment || 0;
        const principalAmount = totalPrice - downPayment;
        
        const emiAmount = calculateLoanEMI({
          principalAmount,
          annualInterestRate: data.interestRate,
          loanTermMonths: data.totalInstallments,
        });

        const remainingBalance = calculateRemainingBalance({
          principalAmount,
          annualInterestRate: data.interestRate,
          loanTermMonths: data.totalInstallments,
          paymentsMade: data.installmentsPaid || 0,
        });

        const completionPercentage = calculateCompletionPercentage(
          data.installmentsPaid || 0,
          data.totalInstallments
        );

        const nextDueDate = calculateNextDueDate(
          data.startDate.toDate(),
          data.installmentsPaid || 0,
          data.totalInstallments
        );

        const remainingInstallments = data.totalInstallments - (data.installmentsPaid || 0);

        return {
          id: doc.id,
          ...data,
          principalAmount,
          emiAmount,
          remainingBalance,
          completionPercentage,
          nextDueDate,
          remainingInstallments,
        };
      });

      setEmis(emisData);
    } catch (err) {
      console.error('Error loading EMIs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addEMI = async (emiData) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const totalPrice = parseFloat(emiData.totalPrice);
      const downPayment = parseFloat(emiData.downPayment) || 0;
      const principalAmount = totalPrice - downPayment;

      const emiAmount = calculateLoanEMI({
        principalAmount,
        annualInterestRate: parseFloat(emiData.interestRate),
        loanTermMonths: parseInt(emiData.totalInstallments),
      });

      const newEMI = {
        itemName: emiData.itemName,
        category: emiData.category || 'electronics',
        storeName: emiData.storeName || '',
        totalPrice,
        downPayment,
        emiAmount,
        totalInstallments: parseInt(emiData.totalInstallments),
        interestRate: parseFloat(emiData.interestRate),
        startDate: Timestamp.fromDate(new Date(emiData.startDate)),
        installmentsPaid: 0,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, `users/${user.uid}/emis`), newEMI);
      await loadEMIs();
    } catch (err) {
      console.error('Error adding EMI:', err);
      throw err;
    }
  };

  const recordPayment = async (emiId) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const emi = emis.find(e => e.id === emiId);
      if (!emi) throw new Error('EMI not found');

      const emiRef = doc(db, `users/${user.uid}/emis/${emiId}`);
      const newInstallmentsPaid = (emi.installmentsPaid || 0) + 1;

      await updateDoc(emiRef, {
        installmentsPaid: newInstallmentsPaid,
        updatedAt: Timestamp.now(),
      });

      await loadEMIs();
    } catch (err) {
      console.error('Error recording EMI payment:', err);
      throw err;
    }
  };

  const deleteEMI = async (emiId) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const emiRef = doc(db, `users/${user.uid}/emis/${emiId}`);
      await updateDoc(emiRef, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      await loadEMIs();
    } catch (err) {
      console.error('Error deleting EMI:', err);
      throw err;
    }
  };

  return {
    emis,
    loading,
    error,
    addEMI,
    recordPayment,
    deleteEMI,
    refreshEMIs: loadEMIs,
  };
};