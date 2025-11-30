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
  calculateTotalRepayment,
  calculateRemainingBalance,
  calculateNextDueDate,
} from '@/lib/debtCalculations';

export const usePersonalLoans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoans([]);
      setLoading(false);
      return;
    }

    loadLoans();
  }, [user]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, `users/${user.uid}/personalLoans`),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const loansData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure numeric values
        const principalAmount = parseFloat(data.principalAmount) || 0;
        const interestRate = parseFloat(data.interestRate) || 0;
        const loanTermMonths = parseInt(data.loanTermMonths) || 1;
        const paymentsMade = parseInt(data.paymentsMade) || 0;
        
        // Calculate derived values
        const emi = calculateLoanEMI({
          principalAmount,
          annualInterestRate: interestRate,
          loanTermMonths,
        });

        const totalRepayment = calculateTotalRepayment({
          principalAmount,
          annualInterestRate: interestRate,
          loanTermMonths,
        });

        const remainingBalance = calculateRemainingBalance({
          principalAmount,
          annualInterestRate: interestRate,
          loanTermMonths,
          paymentsMade,
        });

        const nextDueDate = calculateNextDueDate(
          data.startDate.toDate(),
          paymentsMade,
          loanTermMonths
        );

        const remainingMonths = loanTermMonths - paymentsMade;

        return {
          id: doc.id,
          ...data,
          principalAmount,
          interestRate,
          loanTermMonths,
          paymentsMade,
          emi,
          totalRepayment,
          remainingBalance,
          nextDueDate,
          remainingMonths,
        };
      });

      setLoans(loansData);
    } catch (err) {
      console.error('Error loading personal loans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addLoan = async (loanData) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Parse and validate input
      const principalAmount = parseFloat(loanData.principalAmount);
      const interestRate = parseFloat(loanData.interestRate) || 0;
      const loanTermMonths = parseInt(loanData.loanTermMonths);

      if (isNaN(principalAmount) || principalAmount <= 0) {
        throw new Error('Invalid principal amount');
      }

      if (isNaN(loanTermMonths) || loanTermMonths <= 0) {
        throw new Error('Invalid loan term');
      }

      const emi = calculateLoanEMI({
        principalAmount,
        annualInterestRate: interestRate,
        loanTermMonths,
      });

      const totalRepayment = calculateTotalRepayment({
        principalAmount,
        annualInterestRate: interestRate,
        loanTermMonths,
      });

      const newLoan = {
        lenderName: loanData.lenderName,
        loanType: loanData.loanType || 'personal',
        principalAmount,
        interestRate,
        loanTermMonths,
        monthlyInstallment: emi,
        totalRepayment,
        startDate: Timestamp.fromDate(new Date(loanData.startDate)),
        paymentsMade: 0,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('Adding loan:', newLoan); // Debug log

      await addDoc(collection(db, `users/${user.uid}/personalLoans`), newLoan);
      await loadLoans();
    } catch (err) {
      console.error('Error adding loan:', err);
      throw err;
    }
  };

  const recordPayment = async (loanId) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const loan = loans.find(l => l.id === loanId);
      if (!loan) throw new Error('Loan not found');

      const loanRef = doc(db, `users/${user.uid}/personalLoans/${loanId}`);
      const newPaymentsMade = (loan.paymentsMade || 0) + 1;

      await updateDoc(loanRef, {
        paymentsMade: newPaymentsMade,
        updatedAt: Timestamp.now(),
      });

      await loadLoans();
    } catch (err) {
      console.error('Error recording payment:', err);
      throw err;
    }
  };

  const deleteLoan = async (loanId) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const loanRef = doc(db, `users/${user.uid}/personalLoans/${loanId}`);
      await updateDoc(loanRef, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      await loadLoans();
    } catch (err) {
      console.error('Error deleting loan:', err);
      throw err;
    }
  };

  return {
    loans,
    loading,
    error,
    addLoan,
    recordPayment,
    deleteLoan,
    refreshLoans: loadLoans,
  };
};