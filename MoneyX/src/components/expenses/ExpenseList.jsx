import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useExpenses } from '@/hooks/useExpenses';
import { useToast } from '@/components/common/Toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatCurrency, formatDate, isToday } from '@/lib/utils';
import { getCategoryIcon, getCategoryLabel, getCategoryColor, EXPENSE_CATEGORIES } from '@/lib/categories';
import { groupExpensesByDate } from '@/lib/calculations';
import { Trash2, CreditCard, Wallet, Edit2 } from 'lucide-react';

export const ExpenseList = ({ filters }) => {
  const { expenses, deleteExpense, updateExpense } = useExpenses();
  const toast = useToast();
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', amount: '', category: 'others' });
  const [saving, setSaving] = useState(false);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Category filter
      if (filters.category !== 'all' && expense.category !== filters.category) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethod !== 'all') {
        const isCreditCard = expense.paymentMethod?.type === 'creditCard';
        if (filters.paymentMethod === 'cash' && isCreditCard) return false;
        if (filters.paymentMethod === 'card' && !isCreditCard) return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const expenseDate = expense.date.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filters.dateRange === 'today' && !isToday(expenseDate)) {
          return false;
        }

        if (filters.dateRange === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (expenseDate < weekAgo) return false;
        }

        if (filters.dateRange === 'month') {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          if (expenseDate < startOfMonth) return false;
        }
      }

      return true;
    });
  }, [expenses, filters]);

  // Group by date
  const groupedExpenses = useMemo(() => {
    return groupExpensesByDate(filteredExpenses);
  }, [filteredExpenses]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await deleteExpense(deleteId);
      toast.success('Expense deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (expense) => {
    setEditExpense(expense);
    setEditForm({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category || 'others',
    });
  };

  const handleEditSave = async () => {
    if (!editExpense || !editForm.name || !editForm.amount) {
      toast.error('Please enter valid details');
      return;
    }

    try {
      setSaving(true);
      await updateExpense(editExpense.id, {
        name: editForm.name,
        amount: editForm.amount,
        category: editForm.category,
      });
      toast.success('Expense updated');
      setEditExpense(null);
    } catch (error) {
      toast.error('Failed to update expense');
    } finally {
      setSaving(false);
    }
  };

  if (filteredExpenses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No expenses found with current filters</p>
      </div>
    );
  }

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <Badge variant="secondary">
              {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Expenses */}
      <div className="space-y-4">
        {groupedExpenses.map((group) => (
          <div key={group.date} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">
                {isToday(new Date(group.date)) ? 'Today' : formatDate(new Date(group.date), 'short')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(group.totalAmount)}
              </p>
            </div>

            <div className="space-y-2">
              {group.expenses.map((expense) => (
                <Card key={expense.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Category Icon */}
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{
                          backgroundColor: getCategoryColor(expense.category) + '20',
                        }}
                      >
                        {getCategoryIcon(expense.category)}
                      </div>

                      {/* Expense Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{expense.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getCategoryLabel(expense.category)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold">
                              {formatCurrency(expense.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(expense.date.toDate(), 'time')}
                            </p>
                          </div>
                        </div>

                        {/* Payment Method & Actions */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {expense.paymentMethod?.type === 'creditCard' ? (
                              <Badge variant="secondary" className="text-xs">
                                <CreditCard className="h-3 w-3 mr-1" />
                                Credit Card
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Wallet className="h-3 w-3 mr-1" />
                                Cash
                              </Badge>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(expense)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense?"
        description="This action cannot be undone. The expense will be permanently deleted and your expendables will be updated."
        confirmText="Delete"
        isLoading={deleting}
      />

      <Dialog open={!!editExpense} onOpenChange={(open) => !open && setEditExpense(null)}>
        <DialogContent onClose={() => setEditExpense(null)}>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Description</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAmount">Amount</Label>
              <Input
                id="editAmount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategory">Category</Label>
              <Select
                id="editCategory"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button className="w-full" onClick={handleEditSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};