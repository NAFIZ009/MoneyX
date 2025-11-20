import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { useExpenses } from '@/hooks/useExpenses';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useToast } from '@/components/common/Toast';
import { EXPENSE_CATEGORIES } from '@/lib/categories';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const QuickAddExpense = ({ open, onOpenChange }) => {
  const { addExpense } = useExpenses();
  const { cards } = useCreditCards();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'others',
    fromCreditCard: false,
    creditCardId: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter valid expense details');
      return;
    }

    if (formData.fromCreditCard && !formData.creditCardId) {
      toast.error('Please select a credit card');
      return;
    }

    try {
      setLoading(true);
      await addExpense(formData);
      toast.success('Expense added successfully!');
      onOpenChange(false);
      setFormData({
        name: '',
        amount: '',
        category: 'others',
        fromCreditCard: false,
        creditCardId: '',
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Quickly track your daily expenses
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Description</Label>
            <Input
              id="name"
              placeholder="e.g., Lunch, Uber, Groceries"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              autoFocus
            />
          </div>

          <CurrencyInput
            label="Amount"
            placeholder="0"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value })}
            disabled={loading}
          />

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={loading}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </Select>
          </div>

          {cards.length > 0 && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fromCreditCard"
                  checked={formData.fromCreditCard}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      fromCreditCard: checked,
                      creditCardId: checked ? cards[0]?.id || '' : '',
                    })
                  }
                  disabled={loading}
                />
                <Label htmlFor="fromCreditCard" className="cursor-pointer">
                  Paid with Credit Card
                </Label>
              </div>

              {formData.fromCreditCard && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="creditCard">Select Card</Label>
                    <Select
                      id="creditCard"
                      value={formData.creditCardId}
                      onChange={(e) =>
                        setFormData({ ...formData, creditCardId: e.target.value })
                      }
                      disabled={loading}
                    >
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <Alert>
                    <AlertDescription className="text-xs">
                      💡 This amount will be reserved from your expendables and added to your card bill
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};