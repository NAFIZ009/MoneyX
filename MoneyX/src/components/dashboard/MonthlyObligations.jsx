import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useFinance } from '@/hooks/useFinance';
import { formatCurrency, getMonthKey } from '@/lib/utils';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MonthlyObligations = () => {
  const { user } = useAuth();
  const { currentMonth } = useFinance();
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Filter obligations based on search (case insensitive)
  const filteredObligations = useMemo(() => {
    if (!searchTerm.trim()) return obligations;
    
    const search = searchTerm.toLowerCase();
    return obligations.filter((obligation) =>
      obligation.name.toLowerCase().includes(search)
    );
  }, [obligations, searchTerm]);

  // Show limited or all based on expansion
  const displayedObligations = isExpanded
    ? filteredObligations
    : filteredObligations.slice(0, 3);

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
      <CardContent className="space-y-3">
        {/* Search Input */}
        {obligations.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search obligations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Obligations List (Scrollable) */}
        <div className={`space-y-2 ${isExpanded ? 'max-h-96 overflow-y-auto' : ''}`}>
          {displayedObligations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No obligations found
            </p>
          ) : (
            displayedObligations.map((obligation) => (
              <div
                key={obligation.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={obligation.isPaid}
                    onCheckedChange={() => handleTogglePaid(obligation)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{obligation.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(obligation.amount)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {obligation.type === 'expense' ? 'Expense' : 'DPS'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Expand/Collapse Button */}
        {filteredObligations.length > 3 && (
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                Show Less
                <ChevronUp className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Show All {filteredObligations.length} Obligations
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};