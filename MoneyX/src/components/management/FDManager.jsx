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
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateFDMaturity } from '@/lib/calculations';
import { Plus, Trash2, Landmark } from 'lucide-react';

export const FDManager = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    interestRate: '',
    termYears: '1',
  });

  useEffect(() => {
    if (user) loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, `users/${user.uid}/fdAccounts`),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      setAccounts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error('Failed to load FD accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter valid FD details');
      return;
    }

    const termYears = parseFloat(formData.termYears) || 1;
    const interestRate = parseFloat(formData.interestRate) || 0;

    try {
      await addDoc(collection(db, `users/${user.uid}/fdAccounts`), {
        name: formData.name,
        amount: parseFloat(formData.amount),
        interestRate,
        termYears,
        depositDate: Timestamp.now(),
        maturityDate: Timestamp.fromDate(
          new Date(Date.now() + termYears * 365 * 24 * 60 * 60 * 1000)
        ),
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success('FD account added!');
      setFormData({ name: '', amount: '', interestRate: '', termYears: '1' });
      setShowAddForm(false);
      await loadAccounts();
    } catch (error) {
      toast.error('Failed to add FD account');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/fdAccounts/${deleteId}`), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
      toast.success('FD account deleted');
      setDeleteId(null);
      await loadAccounts();
    } catch (error) {
      toast.error('Failed to delete FD account');
    }
  };

  const totalDeposited = accounts.reduce((sum, acc) => sum + (acc.amount || 0), 0);

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {accounts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Deposited</p>
            <p className="text-2xl font-bold">{formatCurrency(totalDeposited)}</p>
          </CardContent>
        </Card>
      )}

      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Fixed Deposit
        </Button>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Fixed Deposit</CardTitle>
            <CardDescription>Track your FD investments</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fdName">FD Name</Label>
                <Input
                  id="fdName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., DBBL FD"
                />
              </div>

              <CurrencyInput
                label="Deposit Amount"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
              />

              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (% per year)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termYears">Term (years)</Label>
                <Input
                  id="termYears"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.termYears}
                  onChange={(e) => setFormData({ ...formData, termYears: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full">Add FD</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No Fixed Deposits"
          description="Add your FD accounts to track investments"
        />
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => {
            const maturity = calculateFDMaturity({
              principalAmount: account.amount,
              interestRate: account.interestRate || 0,
              years: account.termYears || 1,
            });

            return (
              <Card key={account.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(account.amount)} · {account.interestRate || 0}% · {account.termYears || 1}yr
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Maturity: ~{formatCurrency(maturity)}
                        {account.maturityDate && (
                          <> · {formatDate(account.maturityDate.toDate?.() || account.maturityDate, 'short')}</>
                        )}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(account.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete FD Account?"
        description="This FD will be removed from your records."
        confirmText="Delete"
      />
    </div>
  );
};
