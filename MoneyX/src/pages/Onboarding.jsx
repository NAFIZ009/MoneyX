import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/common/Toast';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepSalary } from '@/components/onboarding/StepSalary';
import { StepFixedExpenses } from '@/components/onboarding/StepFixedExpenses';
import { StepDPS } from '@/components/onboarding/StepDPS';
import { StepFD } from '@/components/onboarding/StepFD';
import { StepCreditCards } from '@/components/onboarding/StepCreditCards';
import { StepFutureSavings } from '@/components/onboarding/StepFutureSavings';
import { StepComplete } from '@/components/onboarding/StepComplete';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    salary: {},
    expenses: [],
    dpsAccounts: [],
    fdAccounts: [],
    cards: [],
    savings: [],
  });

  const handleStepComplete = (stepData) => {
    const stepKey = {
      1: 'salary',
      2: 'expenses',
      3: 'dpsAccounts',
      4: 'fdAccounts',
      5: 'cards',
      6: 'savings',
    }[currentStep];

    setFormData({
      ...formData,
      [stepKey]: stepData[stepKey] || stepData,
    });

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Save all onboarding data to Firestore
      const userRef = doc(db, 'users', user.uid);

      // Update user settings
      await updateDoc(userRef, {
        'settings.onboardingComplete': true,
        updatedAt: Timestamp.now(),
      });

      // Save fixed expenses
      if (formData.expenses && formData.expenses.length > 0) {
        const expensesPromises = formData.expenses.map((expense) =>
          addDoc(collection(db, `users/${user.uid}/fixedExpenses`), {
            name: expense.name,
            amount: expense.amount,
            type: 'fixed',
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        );
        await Promise.all(expensesPromises);
      }

      // Save DPS accounts
      if (formData.dpsAccounts && formData.dpsAccounts.length > 0) {
        const dpsPromises = formData.dpsAccounts.map((dps) =>
          addDoc(collection(db, `users/${user.uid}/dpsAccounts`), {
            name: dps.name,
            monthlyAmount: dps.monthlyAmount,
            installmentsPaidBefore: dps.installmentsPaid,
            totalInstallments: 60, // Default 5 years
            startDate: Timestamp.now(),
            maturityDate: Timestamp.fromDate(
              new Date(Date.now() + 60 * 30 * 24 * 60 * 60 * 1000)
            ),
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        );
        await Promise.all(dpsPromises);
      }

      // Save FD accounts
      if (formData.fdAccounts && formData.fdAccounts.length > 0) {
        const fdPromises = formData.fdAccounts.map((fd) =>
          addDoc(collection(db, `users/${user.uid}/fdAccounts`), {
            name: fd.name,
            amount: fd.amount,
            interestRate: 0,
            depositDate: Timestamp.now(),
            maturityDate: Timestamp.fromDate(
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            ),
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        );
        await Promise.all(fdPromises);
      }

      // Save credit cards
      if (formData.cards && formData.cards.length > 0) {
        const cardsPromises = formData.cards.map((card) =>
          addDoc(collection(db, `users/${user.uid}/creditCards`), {
            name: card.name,
            limit: card.limit,
            color: card.color,
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        );
        await Promise.all(cardsPromises);
      }

      // Save future savings
      if (formData.savings && formData.savings.length > 0) {
        const savingsPromises = formData.savings.map((saving) =>
          addDoc(collection(db, `users/${user.uid}/futureSavings`), {
            name: saving.name,
            targetAmount: saving.amount,
            allocatedAmount: saving.amount,
            targetMonth: new Date().toISOString().slice(0, 7),
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        );
        await Promise.all(savingsPromises);
      }

      toast.success('Setup completed successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to save your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <OnboardingLayout currentStep={currentStep}>
      {currentStep === 1 && (
        <StepSalary onNext={handleStepComplete} initialData={formData.salary} />
      )}
      {currentStep === 2 && (
        <StepFixedExpenses
          onNext={handleStepComplete}
          onBack={handleBack}
          initialData={{ expenses: formData.expenses }}
        />
      )}
      {currentStep === 3 && (
        <StepDPS
          onNext={handleStepComplete}
          onBack={handleBack}
          initialData={{ dpsAccounts: formData.dpsAccounts }}
        />
      )}
      {currentStep === 4 && (
        <StepFD
          onNext={handleStepComplete}
          onBack={handleBack}
          initialData={{ fdAccounts: formData.fdAccounts }}
        />
      )}
      {currentStep === 5 && (
        <StepCreditCards
          onNext={handleStepComplete}
          onBack={handleBack}
          initialData={{ cards: formData.cards }}
        />
      )}
      {currentStep === 6 && (
        <StepFutureSavings
          onNext={handleStepComplete}
          onBack={handleBack}
          initialData={{ savings: formData.savings }}
        />
      )}
      {currentStep === 7 && (
        <StepComplete onComplete={handleComplete} summary={formData} />
      )}
    </OnboardingLayout>
  );
}