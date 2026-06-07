import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, collection, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useFinance } from '@/hooks/useFinance';
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
  const { user, refreshUser } = useAuth();
  const { setSalary } = useFinance();
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

      const userRef = doc(db, 'users', user.uid);

      const salarySettings = formData.salary?.isFixed && formData.salary?.fixedAmount
        ? {
            isFixed: true,
            amount: parseFloat(formData.salary.fixedAmount),
          }
        : { isFixed: false, amount: null };

      if (formData.expenses?.length > 0) {
        await Promise.all(
          formData.expenses.map((expense) =>
            addDoc(collection(db, `users/${user.uid}/fixedExpenses`), {
              name: expense.name,
              amount: expense.amount,
              type: 'fixed',
              isActive: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            })
          )
        );
      }

      if (formData.dpsAccounts?.length > 0) {
        await Promise.all(
          formData.dpsAccounts.map((dps) =>
            addDoc(collection(db, `users/${user.uid}/dpsAccounts`), {
              name: dps.name,
              monthlyAmount: dps.monthlyAmount,
              installmentsPaidBefore: dps.installmentsPaid || 0,
              totalInstallments: dps.totalInstallments || 60,
              interestRate: dps.interestRate || 0,
              startDate: Timestamp.now(),
              maturityDate: Timestamp.fromDate(
                new Date(Date.now() + (dps.totalInstallments || 60) * 30 * 24 * 60 * 60 * 1000)
              ),
              isActive: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            })
          )
        );
      }

      if (formData.fdAccounts?.length > 0) {
        await Promise.all(
          formData.fdAccounts.map((fd) =>
            addDoc(collection(db, `users/${user.uid}/fdAccounts`), {
              name: fd.name,
              amount: fd.amount,
              interestRate: fd.interestRate || 0,
              termYears: fd.termYears || 1,
              depositDate: Timestamp.now(),
              maturityDate: Timestamp.fromDate(
                new Date(Date.now() + (fd.termYears || 1) * 365 * 24 * 60 * 60 * 1000)
              ),
              isActive: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            })
          )
        );
      }

      if (formData.cards?.length > 0) {
        await Promise.all(
          formData.cards.map((card) =>
            addDoc(collection(db, `users/${user.uid}/creditCards`), {
              name: card.name,
              limit: card.limit,
              color: card.color,
              isActive: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            })
          )
        );
      }

      if (formData.savings?.length > 0) {
        await Promise.all(
          formData.savings.map((saving) =>
            addDoc(collection(db, `users/${user.uid}/futureSavings`), {
              name: saving.name,
              targetAmount: saving.amount,
              allocatedAmount: saving.amount,
              targetMonth: saving.targetMonth || new Date().toISOString().slice(0, 7),
              isActive: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            })
          )
        );
      }

      await updateDoc(userRef, {
        'settings.onboardingComplete': true,
        'settings.defaultSalary': salarySettings,
        updatedAt: Timestamp.now(),
      });

      if (salarySettings.isFixed && salarySettings.amount > 0) {
        await setSalary(salarySettings.amount);
      }

      await refreshUser();
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
