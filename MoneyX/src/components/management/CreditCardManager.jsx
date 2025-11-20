import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/common/Toast';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthKey } from '@/lib/utils';
import { Plus, Trash2, CreditCard, DollarSign, FileText, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CARD_COLORS = [
  { value: '#4ECDC4', label: 'Teal' },
  { value: '#FF6B6B', label: 'Red' },
  { value: '#95E1D3', label: 'Mint' },
  { value: '#F38181', label: 'Pink' },
  { value: '#AA96DA', label: 'Purple' },
  { value: '#FCBAD3', label: 'Light Pink' },
];

export const CreditCardManager = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    limit: '',
    color: CARD_COLORS[0].value,
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [billData, setBillData] = useState({
    previousBill: '',
    thisMonthTransactions: '',
  });

  useEffect(() => {
    if (user) {
      loadCards();
    }
  }, [user]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const monthKey = getMonthKey();
      const q = query(
        collection(db, `users/${user.uid}/creditCards`),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);

      const cardsWithBills = await Promise.all(
        snapshot.docs.map(async (cardDoc) => {
          const card = cardDoc.data();
          const billRef = doc(db, `users/${user.uid}/creditCards/${cardDoc.id}/bills/${monthKey}`);
          const billDoc = await getDoc(billRef);

          const bill = billDoc.exists()
            ? billDoc.data()
            : {
                previousBill: 0,
                thisMonthTransactions: 0,
                totalPending: 0,
                paidAmount: 0,
                remainingBalance: 0,
                isPaidFull: false,
              };

          return {
            id: cardDoc.id,
            ...card,
            bill,
          };
        })
      );

      setCards(cardsWithBills);
    } catch (error) {
      console.error('Error loading credit cards:', error);
      toast.error('Failed to load credit cards');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.limit || parseFloat(formData.limit) <= 0) {
      toast.error('Please enter valid card details');
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/creditCards`), {
        name: formData.name,
        limit: parseFloat(formData.limit),
        color: formData.color,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success('Credit card added successfully!');
      setFormData({ name: '', limit: '', color: CARD_COLORS[0].value });
      setShowAddForm(false);
      await loadCards();
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to add credit card');
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();

    if (!selectedCard) return;

    const previousBill = parseFloat(billData.previousBill) || 0;
    const thisMonthTransactions = parseFloat(billData.thisMonthTransactions) || 0;

    if (previousBill < 0 || thisMonthTransactions < 0) {
      toast.error('Amounts cannot be negative');
      return;
    }

    if (previousBill === 0 && thisMonthTransactions === 0) {
      toast.error('Please enter at least one amount');
      return;
    }

    try {
      const monthKey = getMonthKey();
      const billRef = doc(
        db,
        `users/${user.uid}/creditCards/${selectedCard.id}/bills/${monthKey}`
      );

      const totalPending = previousBill + thisMonthTransactions;

      await setDoc(
        billRef,
        {
          monthKey,
          previousBill,
          thisMonthTransactions,
          totalPending,
          paidAmount: 0,
          remainingBalance: totalPending,
          isPaidFull: false,
          manuallyAdded: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      toast.success('Bill added successfully!');
      setBillData({ previousBill: '', thisMonthTransactions: '' });
      setShowBillDialog(false);
      setSelectedCard(null);
      await loadCards();
    } catch (error) {
      console.error('Error adding bill:', error);
      toast.error('Failed to add bill');
    }
  };

  const handlePayment = async () => {
    if (!selectedCard || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > selectedCard.bill.totalPending) {
      toast.error('Payment amount cannot exceed total pending');
      return;
    }

    try {
      const monthKey = getMonthKey();
      const billRef = doc(
        db,
        `users/${user.uid}/creditCards/${selectedCard.id}/bills/${monthKey}`
      );

      const newPaidAmount = (selectedCard.bill.paidAmount || 0) + amount;
      const newRemainingBalance = selectedCard.bill.totalPending - newPaidAmount;
      const isPaidFull = newRemainingBalance === 0;

      await setDoc(
        billRef,
        {
          monthKey,
          previousBill: selectedCard.bill.previousBill || 0,
          thisMonthTransactions: selectedCard.bill.thisMonthTransactions || 0,
          totalPending: selectedCard.bill.totalPending,
          paidAmount: newPaidAmount,
          remainingBalance: newRemainingBalance,
          isPaidFull,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      toast.success('Payment recorded successfully!');
      setPaymentAmount('');
      setShowPaymentDialog(false);
      setSelectedCard(null);
      await loadCards();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await updateDoc(doc(db, `users/${user.uid}/creditCards/${deleteId}`), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      toast.success('Credit card deleted successfully');
      setDeleteId(null);
      await loadCards();
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete credit card');
    }
  };

  const openBillDialog = (card) => {
    setSelectedCard(card);
    setBillData({
      previousBill: card.bill.previousBill?.toString() || '',
      thisMonthTransactions: card.bill.thisMonthTransactions?.toString() || '',
    });
    setShowBillDialog(true);
  };

  const totalPending = cards.reduce((sum, card) => sum + (card.bill?.totalPending || 0), 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {cards.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Cards</p>
                <p className="text-2xl font-bold">{cards.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Credit Card
        </Button>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Credit Card</CardTitle>
            <CardDescription>Track your credit card bills and spending</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Card Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Visa Card, Mastercard Gold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <CurrencyInput
                label="Credit Limit"
                placeholder="0"
                value={formData.limit}
                onChange={(value) => setFormData({ ...formData, limit: value })}
              />

              <div className="space-y-2">
                <Label>Card Color</Label>
                <div className="flex gap-2">
                  {CARD_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-10 w-10 rounded-full transition-all ${
                        formData.color === color.value
                          ? 'ring-4 ring-primary ring-offset-2'
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', limit: '', color: CARD_COLORS[0].value });
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full">
                  Add Card
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Cards List */}
      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Credit Cards"
          description="Add your credit cards to track bills and spending"
        />
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <Card key={card.id} style={{ borderColor: card.color, borderWidth: 2 }}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: card.color + '20' }}
                      >
                        <CreditCard className="h-5 w-5" style={{ color: card.color }} />
                      </div>
                      <div>
                        <p className="font-medium">{card.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Limit: {formatCurrency(card.limit)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(card.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Bill Details */}
                  {card.bill.totalPending > 0 ? (
                    <>
                      <div className="space-y-2 p-3 bg-muted rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Pending</span>
                          <span className="font-semibold">
                            {formatCurrency(card.bill.totalPending)}
                          </span>
                        </div>
                        {card.bill.previousBill > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Previous Bill</span>
                            <span>{formatCurrency(card.bill.previousBill)}</span>
                          </div>
                        )}
                        {card.bill.thisMonthTransactions > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">This Month</span>
                            <span>{formatCurrency(card.bill.thisMonthTransactions)}</span>
                          </div>
                        )}
                        {card.bill.paidAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Paid</span>
                            <span className="text-green-600">
                              {formatCurrency(card.bill.paidAmount)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => openBillDialog(card)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Bill
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedCard(card);
                            setShowPaymentDialog(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Pay Bill
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge variant="success" className="w-full justify-center">
                        No Pending Bill
                      </Badge>
                      <Button
                        onClick={() => openBillDialog(card)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Bill Manually
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Bill Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent onClose={() => setShowBillDialog(false)}>
          <DialogHeader>
            <DialogTitle>
              {selectedCard?.bill?.totalPending > 0 ? 'Edit' : 'Add'} Credit Card Bill
            </DialogTitle>
            <DialogDescription>
              {selectedCard?.name} - Enter bill details for this month
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBill} className="space-y-4 py-4">
            <Alert>
              <AlertDescription className="text-xs">
                💡 Add your credit card statement details here. This will help track your monthly bills.
              </AlertDescription>
            </Alert>

            <CurrencyInput
              label="Previous Bill / Outstanding Balance"
              placeholder="0"
              value={billData.previousBill}
              onChange={(value) => setBillData({ ...billData, previousBill: value })}
            />

            <CurrencyInput
              label="This Month's Transactions"
              placeholder="0"
              value={billData.thisMonthTransactions}
              onChange={(value) =>
                setBillData({ ...billData, thisMonthTransactions: value })
              }
            />

            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bill</span>
                <span className="font-medium">
                  {formatCurrency(
                    (parseFloat(billData.previousBill) || 0) +
                      (parseFloat(billData.thisMonthTransactions) || 0)
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowBillDialog(false);
                  setBillData({ previousBill: '', thisMonthTransactions: '' });
                  setSelectedCard(null);
                }}
                className="w-full"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                {selectedCard?.bill?.totalPending > 0 ? 'Update Bill' : 'Add Bill'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent onClose={() => setShowPaymentDialog(false)}>
          <DialogHeader>
            <DialogTitle>Pay Credit Card Bill</DialogTitle>
            <DialogDescription>
              {selectedCard?.name} - {formatCurrency(selectedCard?.bill?.totalPending || 0)}{' '}
              pending
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <CurrencyInput
              label="Payment Amount"
              placeholder="0"
              value={paymentAmount}
              onChange={setPaymentAmount}
            />

            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pending</span>
                <span className="font-medium">
                  {formatCurrency(selectedCard?.bill?.totalPending || 0)}
                </span>
              </div>
              {paymentAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">After Payment</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (selectedCard?.bill?.totalPending || 0) - parseFloat(paymentAmount || 0)
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPaymentAmount('');
                  setSelectedCard(null);
                }}
                className="w-full"
              >
                Cancel
              </Button>
              <Button onClick={handlePayment} className="w-full">
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Credit Card?"
        description="This card will be removed. All transaction history will be kept."
        confirmText="Delete"
      />
    </div>
  );
};