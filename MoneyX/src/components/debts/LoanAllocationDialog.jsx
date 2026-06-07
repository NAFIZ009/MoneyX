import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, getMonthKey } from '@/lib/utils';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Wallet, CreditCard, Receipt, Info } from 'lucide-react';

export const LoanAllocationDialog = ({
  open,
  onOpenChange,
  loanAmount,
  onConfirm,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [addToExpendables, setAddToExpendables] = useState(true);
  const [obligations, setObligations] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [selectedObligations, setSelectedObligations] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);

  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [open, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadObligations(), loadCreditCards()]);
    } catch (error) {
      console.error('Error loading allocation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadObligations = async () => {
    try {
      const monthKey = getMonthKey();
      const unpaidObligations = [];

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

        if (!paymentData.isPaid) {
          unpaidObligations.push({
            id: expenseDoc.id,
            type: 'expense',
            name: expense.name,
            amount: expense.amount,
          });
        }
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

        if (!paymentData.isPaid) {
          unpaidObligations.push({
            id: dpsDoc.id,
            type: 'dps',
            name: dps.name,
            amount: dps.monthlyAmount,
          });
        }
      }

      setObligations(unpaidObligations);
    } catch (error) {
      console.error('Error loading obligations:', error);
    }
  };

  const loadCreditCards = async () => {
    try {
      const monthKey = getMonthKey();
      const cardsQuery = query(
        collection(db, `users/${user.uid}/creditCards`),
        where('isActive', '==', true)
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      const cardsWithBills = await Promise.all(
        cardsSnapshot.docs.map(async (cardDoc) => {
          const card = cardDoc.data();
          const billRef = doc(
            db,
            `users/${user.uid}/creditCards/${cardDoc.id}/bills/${monthKey}`
          );
          const billDoc = await getDoc(billRef);

          if (billDoc.exists()) {
            const bill = billDoc.data();
            if (bill.totalPending > 0) {
              return {
                id: cardDoc.id,
                name: card.name,
                amount: bill.totalPending,
                color: card.color,
              };
            }
          }
          return null;
        })
      );

      setCreditCards(cardsWithBills.filter(Boolean));
    } catch (error) {
      console.error('Error loading credit cards:', error);
    }
  };

  const toggleObligation = (id) => {
    setSelectedObligations((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleCard = (id) => {
    setSelectedCards((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const calculateAllocation = () => {
    const obligationsTotal = obligations
      .filter((o) => selectedObligations.includes(o.id))
      .reduce((sum, o) => sum + o.amount, 0);

    const cardsTotal = creditCards
      .filter((c) => selectedCards.includes(c.id))
      .reduce((sum, c) => sum + c.amount, 0);

    const allocated = obligationsTotal + cardsTotal;
    const remaining = loanAmount - allocated;

    return { obligationsTotal, cardsTotal, allocated, remaining };
  };

  const handleConfirm = () => {
    const allocation = calculateAllocation();
    onConfirm({
      addToExpendables,
      selectedObligations,
      selectedCards,
      allocation,
      obligationDetails: obligations.filter((o) =>
        selectedObligations.includes(o.id)
      ),
    });
    onOpenChange(false);
  };

  const { obligationsTotal, cardsTotal, allocated, remaining } = calculateAllocation();
  const hasSelections = selectedObligations.length > 0 || selectedCards.length > 0;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent onClose={() => onOpenChange(false)}>
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Allocate Loan Amount</DialogTitle>
          <DialogDescription>
            How do you want to use {formatCurrency(loanAmount)}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add to Expendables Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="addToExpendables"
                checked={addToExpendables}
                onCheckedChange={setAddToExpendables}
              />
              <label htmlFor="addToExpendables" className="text-sm font-medium cursor-pointer">
                Add borrowed money to expendables
              </label>
            </div>

            {addToExpendables && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {hasSelections
                    ? `After payments, ${formatCurrency(remaining)} will be added to your expendables.`
                    : `Full ${formatCurrency(loanAmount)} will be added to your expendables.`}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Unpaid Obligations */}
          {obligations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Pay Obligations ({obligations.length})</h4>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {obligations.map((obligation) => (
                  <div
                    key={obligation.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                    onClick={() => toggleObligation(obligation.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedObligations.includes(obligation.id)}
                        onCheckedChange={() => toggleObligation(obligation.id)}
                      />
                      <div>
                        <p className="text-sm font-medium">{obligation.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(obligation.amount)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {obligation.type === 'expense' ? 'Expense' : 'DPS'}
                    </Badge>
                  </div>
                ))}
              </div>
              {selectedObligations.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {formatCurrency(obligationsTotal)}
                </p>
              )}
            </div>
          )}

          {/* Credit Card Bills */}
          {creditCards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Pay Credit Card Bills ({creditCards.length})</h4>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {creditCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                    onClick={() => toggleCard(card.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedCards.includes(card.id)}
                        onCheckedChange={() => toggleCard(card.id)}
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: card.color }}
                        />
                        <div>
                          <p className="text-sm font-medium">{card.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(card.amount)} pending
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedCards.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {formatCurrency(cardsTotal)}
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-medium">{formatCurrency(loanAmount)}</span>
            </div>
            {hasSelections && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allocated to Payments</span>
                  <span className="font-medium text-orange-600">
                    -{formatCurrency(allocated)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-medium">
                    {addToExpendables ? 'Add to Expendables' : 'Remaining'}
                  </span>
                  <span className="font-bold text-primary">
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </>
            )}
            {!hasSelections && addToExpendables && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">Add to Expendables</span>
                <span className="font-bold text-primary">
                  {formatCurrency(loanAmount)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="w-full"
              disabled={allocated > loanAmount}
            >
              Confirm
            </Button>
          </div>

          {allocated > loanAmount && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                Selected amount ({formatCurrency(allocated)}) exceeds loan amount!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};