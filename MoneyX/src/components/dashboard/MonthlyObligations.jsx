import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useFinance } from '@/hooks/useFinance';
import { formatCurrency, getMonthKey } from '@/lib/utils';
import { Search, ChevronDown, ChevronUp, Wallet, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentMethodDialog } from '@/components/dashboard/PaymentMethodDialog';

export const MonthlyObligations = () => {
  const { user } = useAuth();
  const { currentMonth, updateMonthCalculations } = useFinance();
  const [obligations, setObligations] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadObligations(), loadCreditCards()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreditCards = async () => {
    try {
      const q = query(
        collection(db, `users/${user.uid}/creditCards`),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const cardsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCreditCards(cardsData);
    } catch (error) {
      console.error('Error loading credit cards:', error);
    }
  };

  const loadObligations = async () => {
    try {
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
        const paymentData = paymentDoc.exists() ? paymentDoc.data() : {};

        allObligations.push({
          id: expenseDoc.id,
          type: 'expense',
          name: expense.name,
          amount: expense.amount,
          isPaid: paymentData.isPaid || false,
          paymentMethod: paymentData.paymentMethod || 'cash',
          creditCardId: paymentData.creditCardId || null,
          creditCardName: paymentData.creditCardName || null,
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
        const paymentData = paymentDoc.exists() ? paymentDoc.data() : {};

        allObligations.push({
          id: dpsDoc.id,
          type: 'dps',
          name: dps.name,
          amount: dps.monthlyAmount,
          isPaid: paymentData.isPaid || false,
          paymentMethod: paymentData.paymentMethod || 'cash',
          creditCardId: paymentData.creditCardId || null,
          creditCardName: paymentData.creditCardName || null,
        });
      }

      setObligations(allObligations);
    } catch (error) {
      console.error('Error loading obligations:', error);
    }
  };

  const handleTogglePaid = async (obligation) => {
    if (!obligation.isPaid) {
      // Marking as PAID - show payment method dialog
      setSelectedObligation(obligation);
      setShowPaymentDialog(true);
    } else {
      // Marking as UNPAID - revert payment
      await handleUnpayment(obligation);
    }
  };

  const handlePaymentConfirm = async ({ paymentMethod, creditCardId }) => {
    if (!selectedObligation) return;

    // Optimistically update UI
    setObligations((prev) =>
      prev.map((o) =>
        o.id === selectedObligation.id
          ? {
              ...o,
              isPaid: true,
              paymentMethod,
              creditCardId,
              creditCardName: paymentMethod === 'credit'
                ? creditCards.find(c => c.id === creditCardId)?.name
                : null,
            }
          : o
      )
    );

    try {
      const monthKey = getMonthKey();
      const collectionPath =
        selectedObligation.type === 'expense' ? 'fixedExpenses' : 'dpsAccounts';
      const paymentRef = doc(
        db,
        `users/${user.uid}/${collectionPath}/${selectedObligation.id}/payments/${monthKey}`
      );

      const paymentData = {
        monthKey,
        isPaid: true,
        paidDate: Timestamp.now(),
        amount: selectedObligation.amount,
        paymentMethod,
        creditCardId: paymentMethod === 'credit' ? creditCardId : null,
        creditCardName: paymentMethod === 'credit'
          ? creditCards.find(c => c.id === creditCardId)?.name
          : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(paymentRef, paymentData);

      // If paid with credit card, add to card bill and return to expendables
      if (paymentMethod === 'credit') {
        const billRef = doc(
          db,
          `users/${user.uid}/creditCards/${creditCardId}/bills/${monthKey}`
        );

        // Update or create credit card bill
        const billDoc = await getDoc(billRef);
        if (billDoc.exists()) {
          await updateDoc(billRef, {
            thisMonthTransactions: increment(selectedObligation.amount),
            totalPending: increment(selectedObligation.amount),
            updatedAt: Timestamp.now(),
          });
        } else {
          await setDoc(billRef, {
            monthKey,
            previousBill: 0,
            thisMonthTransactions: selectedObligation.amount,
            totalPending: selectedObligation.amount,
            paidAmount: 0,
            remainingBalance: selectedObligation.amount,
            isPaidFull: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }

        // Return amount to expendables (it didn't come from cash)
        await updateMonthCalculations({
          'calculations.currentExpendables': increment(selectedObligation.amount),
        });
      }

      console.log('✅ Payment recorded successfully');
    } catch (error) {
      console.error('❌ Error recording payment:', error);
      
      // Revert optimistic update
      setObligations((prev) =>
        prev.map((o) =>
          o.id === selectedObligation.id
            ? { ...o, isPaid: false, paymentMethod: 'cash', creditCardId: null }
            : o
        )
      );
      
      alert('Failed to record payment. Please try again.');
    }
  };

  const handleUnpayment = async (obligation) => {
    // Optimistically update UI
    setObligations((prev) =>
      prev.map((o) =>
        o.id === obligation.id
          ? { ...o, isPaid: false, paymentMethod: 'cash', creditCardId: null }
          : o
      )
    );

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
        isPaid: false,
        paidDate: null,
        amount: obligation.amount,
        paymentMethod: 'cash',
        creditCardId: null,
        updatedAt: Timestamp.now(),
      });

      // If was paid with credit card, reverse the card bill and expendables
      if (obligation.paymentMethod === 'credit' && obligation.creditCardId) {
        const billRef = doc(
          db,
          `users/${user.uid}/creditCards/${obligation.creditCardId}/bills/${monthKey}`
        );

        await updateDoc(billRef, {
          thisMonthTransactions: increment(-obligation.amount),
          totalPending: increment(-obligation.amount),
          updatedAt: Timestamp.now(),
        });

        // Remove from expendables (reverse the return)
        await updateMonthCalculations({
          'calculations.currentExpendables': increment(-obligation.amount),
        });
      }

      console.log('✅ Payment reverted successfully');
    } catch (error) {
      console.error('❌ Error reverting payment:', error);
      
      // Revert optimistic update
      setObligations((prev) =>
        prev.map((o) =>
          o.id === obligation.id ? { ...o, isPaid: true } : o
        )
      );
      
      alert('Failed to revert payment. Please try again.');
    }
  };

  // Filter obligations based on search
  const filteredObligations = useMemo(() => {
    if (!searchTerm.trim()) return obligations;
    
    const search = searchTerm.toLowerCase();
    return obligations.filter((obligation) =>
      obligation.name.toLowerCase().includes(search)
    );
  }, [obligations, searchTerm]);

  const displayedObligations = isExpanded
    ? filteredObligations
    : filteredObligations.slice(0, 3);

  // Calculate statistics
  const paidCount = obligations.filter((o) => o.isPaid).length;
  const unpaidCount = obligations.length - paidCount;
  const totalCount = obligations.length;
  
  const paidAmount = obligations
    .filter((o) => o.isPaid)
    .reduce((sum, o) => sum + o.amount, 0);
  
  const unpaidAmount = obligations
    .filter((o) => !o.isPaid)
    .reduce((sum, o) => sum + o.amount, 0);
  
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Obligations</CardTitle>
              <CardDescription>
                {paidCount}/{totalCount} completed • {formatCurrency(totalAmount)} total
              </CardDescription>
            </div>
            <Badge variant={paidCount === totalCount ? 'success' : 'secondary'}>
              {paidCount === totalCount ? 'All Done' : `${unpaidCount} Pending`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(paidAmount)}
              </p>
              <p className="text-xs text-muted-foreground">{paidCount} items</p>
            </div>
            <div className="text-center border-x">
              <p className="text-xs text-muted-foreground">Unpaid</p>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(unpaidAmount)}
              </p>
              <p className="text-xs text-muted-foreground">{unpaidCount} items</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">
                {formatCurrency(totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground">{totalCount} items</p>
            </div>
          </div>

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

          {/* Obligations List */}
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
                        {/* Payment Method Indicator */}
                        {obligation.isPaid && (
                          <div className="flex items-center gap-1">
                            {obligation.paymentMethod === 'credit' ? (
                              <>
                                <CreditCard className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-blue-600">
                                  {obligation.creditCardName}
                                </span>
                              </>
                            ) : (
                              <>
                                <Wallet className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600">Cash</span>
                              </>
                            )}
                          </div>
                        )}
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

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        obligation={selectedObligation}
        creditCards={creditCards}
        onConfirm={handlePaymentConfirm}
      />
    </>
  );
};