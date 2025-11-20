import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, PiggyBank } from 'lucide-react';

export const DPSManager = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    monthlyAmount: '',
    installmentsPaid: '',
  });

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, `users/${user.uid}/dpsAccounts`),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const accountsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading DPS accounts:', error);
      toast.error('Failed to load DPS accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.monthlyAmount || parseFloat(formData.monthlyAmount) <= 0) {
      toast.error('Please enter valid DPS details');
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/dpsAccounts`), {
        name: formData.name,
        monthlyAmount: parseFloat(formData.monthlyAmount),
        installmentsPaidBefore: parseInt(formData.installmentsPaid) || 0,
        totalInstallments: 60,
        startDate: Timestamp.now(),
        maturityDate: Timestamp.fromDate(new Date(Date.now() + 60 * 30 * 24 * 60 * 60 * 1000)),
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success('DPS account added successfully!');
      setFormData({ name: '', monthlyAmount: '', installmentsPaid: '' });
      setShowAddForm(false);
      await loadAccounts();
    } catch (error) {
      console.error('Error adding DPS:', error);
      toast.error('Failed to add DPS account');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await updateDoc(doc(db, `users/${user.uid}/dpsAccounts/${deleteId}`), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      toast.success('DPS account deleted successfully');
      setDeleteId(null);
      await loadAccounts();
    } catch (error) {
      console.error('Error deleting DPS:', error);
      toast.error('Failed to delete DPS account');
    }
  };

  const totalMonthly = accounts.reduce((sum, acc) => sum + acc.monthlyAmount, 0);
  const totalValue = accounts.reduce(
    (sum, acc) => sum + acc.monthlyAmount * (acc.installmentsPaidBefore || 0),
    0
  );

  if (loading) {
    return <div className="animate-pulse space-y-3">
      <div className="h-32 bg-muted rounded-lg" />
    </div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {accounts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly DPS</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMonthly)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add DPS Account
        </Button>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add DPS Account</CardTitle>
            <CardDescription>Track your monthly DPS installments</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">DPS Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., City Bank DPS"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <CurrencyInput
                label="Monthly Installment"
                placeholder="0"
                value={formData.monthlyAmount}
                onChange={(value) => setFormData({ ...formData, monthlyAmount: value })}
              />

              <div className="space-y-2">
                <Label htmlFor="installmentsPaid">Installments Already Paid</Label>
                <Input
                  id="installmentsPaid"
                  type="number"
                  placeholder="0"
                  value={formData.installmentsPaid}
                  onChange={(e) =>
                    setFormData({ ...formData, installmentsPaid: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', monthlyAmount: '', installmentsPaid: '' });
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full">
                  Add DPS
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* DPS List */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No DPS Accounts"
          description="Add your DPS accounts to track monthly installments"
        />
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => {
            const currentValue =
              account.monthlyAmount * (account.installmentsPaidBefore || 0);
            return (
              <Card key={account.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(account.monthlyAmount)}/month
                      </p>
                      {account.installmentsPaidBefore > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Current value: {formatCurrency(currentValue)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(account.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete DPS Account?"
        description="This account will be removed from your monthly calculations."
        confirmText="Delete"
      />
    </div>
  );
};