import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/common/Toast';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Receipt, Edit2 } from 'lucide-react';

export const FixedExpenseManager = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({ name: '', amount: '' });
  const [editFormData, setEditFormData] = useState({ name: '', amount: '' });

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, `users/${user.uid}/fixedExpenses`),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter valid expense details');
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/fixedExpenses`), {
        name: formData.name,
        amount: parseFloat(formData.amount),
        type: 'fixed',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success('Expense added successfully!');
      setFormData({ name: '', amount: '' });
      setShowAddForm(false);
      await loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    if (!editFormData.name || !editFormData.amount || parseFloat(editFormData.amount) <= 0) {
      toast.error('Please enter valid expense details');
      return;
    }

    try {
      await updateDoc(doc(db, `users/${user.uid}/fixedExpenses/${editingExpense.id}`), {
        name: editFormData.name,
        amount: parseFloat(editFormData.amount),
        updatedAt: Timestamp.now(),
      });

      toast.success('Expense updated successfully!');
      setShowEditDialog(false);
      setEditingExpense(null);
      setEditFormData({ name: '', amount: '' });
      await loadExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    }
  };

  const openEditDialog = (expense) => {
    setEditingExpense(expense);
    setEditFormData({
      name: expense.name,
      amount: expense.amount.toString(),
    });
    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await updateDoc(doc(db, `users/${user.uid}/fixedExpenses/${deleteId}`), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      toast.success('Expense deleted successfully');
      setDeleteId(null);
      await loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {expenses.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Monthly</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Fixed Expense
        </Button>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Fixed Expense</CardTitle>
            <CardDescription>Add a monthly recurring expense</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Expense Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Rent, Netflix, Internet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <CurrencyInput
                label="Monthly Amount"
                placeholder="0"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', amount: '' });
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full">
                  Add Expense
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Fixed Expenses"
          description="Add expenses that you pay every month like rent, subscriptions, etc."
        />
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{expense.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(expense.amount)}/month
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(expense)}
                    >
                      <Edit2 className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent onClose={() => setShowEditDialog(false)}>
          <DialogHeader>
            <DialogTitle>Edit Fixed Expense</DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Expense Name</Label>
              <Input
                id="editName"
                placeholder="e.g., Rent, Netflix, Internet"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>

            <CurrencyInput
              label="Monthly Amount"
              placeholder="0"
              value={editFormData.amount}
              onChange={(value) => setEditFormData({ ...editFormData, amount: value })}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingExpense(null);
                  setEditFormData({ name: '', amount: '' });
                }}
                className="w-full"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense?"
        description="This expense will be removed from your monthly calculations."
        confirmText="Delete"
      />
    </div>
  );
};