import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useFinance } from '@/hooks/useFinance';
import { formatCurrency, getMonthKey } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export const MonthlyObligations = () => {
  const { user } = useAuth();
  const { currentMonth } = useFinance();
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadObligations();
    }
  }, [user, currentMonth]);

  const loadObligations = async () => {
    try {
      setLoading(true);
      const monthKey = getMonthKey();
      const allObligations = [];

      // Load Fixed Expenses
      const expensesQuery = query(
        collection(db, `users/${user.uid}/fixedExpenses`),
        where('isActive', '==', true)
      );
      const expensesSnapshot = await getDocs(expensesQuery);

      for (const expenseDoc of expensesSnapshot.docs) {
        const expense = expenseDoc.data();
        const paymentRef = doc(
          db,
          `users/${user.uid}/fixedExpenses/${expenseDoc.id}/payments/${monthKey}`
        );
        const paymentDoc = await getDoc(paymentRef);

        allObligations.push({
          id: expenseDoc.id,
          type: 'expense',
          name: expense.name,
          amount: expense.amount,
          isPaid: paymentDoc.exists() ? paymentDoc.data().isPaid : false,
        });
      }

      // Load DPS
      const dpsQuery = query(
        collection(db, `users/${user.uid}/dpsAccounts`),
        where('isActive', '==', true)
      );
      const dpsSnapshot = await getDocs(dpsQuery);

      for (const dpsDoc of dpsSnapshot.docs) {
        const dps = dpsDoc.data();
        const paymentRef = doc(
          db,
          `users/${user.uid}/dpsAccounts/${dpsDoc.id}/payments/${monthKey}`
        );
        const paymentDoc = await getDoc(paymentRef);

        allObligations.push({
          id: dpsDoc.id,
          type: 'dps',
          name: dps.name,
          amount: dps.monthlyAmount,
          isPaid: paymentDoc.exists() ? paymentDoc.data().isPaid : false,
        });
      }

      setObligations(allObligations);
    } catch (error) {
      console.error('Error loading obligations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async (obligation) => {
    try {
      const monthKey = getMonthKey();
      const collectionPath =
        obligation.type === 'expense' ? 'fixedExpenses' : 'dpsAccounts';
      const paymentRef = doc(
        db,
        `users/${user.uid}/${collectionPath}/${obligation.id}/payments/${monthKey}`
      );

      await setDoc(paymentRef, {
        monthKey,
        isPaid: !obligation.isPaid,
        paidDate: !obligation.isPaid ? new Date() : null,
        amount: obligation.amount,
        createdAt: new Date(),
      });

      await loadObligations();
    } catch (error) {
      console.error('Error toggling payment status:', error);
    }
  };

  const paidCount = obligations.filter((o) => o.isPaid).length;
  const totalCount = obligations.length;
  const totalAmount = obligations.reduce((sum, o) => sum + o.amount, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (obligations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monthly Obligations</CardTitle>
            <CardDescription>
              {paidCount}/{totalCount} paid • {formatCurrency(totalAmount)} total
            </CardDescription>
          </div>
          <Badge variant={paidCount === totalCount ? 'success' : 'secondary'}>
            {paidCount === totalCount ? 'All Done' : 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {obligations.slice(0, 3).map((obligation) => (
          <div
            key={obligation.id}
            className="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1">
              <Checkbox
                checked={obligation.isPaid}
                onCheckedChange={() => handleTogglePaid(obligation)}
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{obligation.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(obligation.amount)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {obligations.length > 3 && (
          <button
            onClick={() => (window.location.href = '/management')}
            className="w-full flex items-center justify-center gap-1 text-sm text-primary hover:underline py-2"
          >
            View all {obligations.length} obligations
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
};