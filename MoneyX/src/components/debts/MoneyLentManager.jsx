import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/common/Toast';
import { useMoneyLent } from '@/hooks/useMoneyLent';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, HandCoins, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const MoneyLentManager = () => {
  const { records, loading, addRecord, recordReturn, deleteRecord } = useMoneyLent();
  const toast = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [returnRecord, setReturnRecord] = useState(null);
  const [returnAmount, setReturnAmount] = useState('');
  const [formData, setFormData] = useState({
    personName: '',
    amount: '',
    lentDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: '',
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.personName || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter valid details');
      return;
    }

    try {
      await addRecord(formData);
      toast.success('Money lent recorded!');
      setFormData({
        personName: '',
        amount: '',
        lentDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: '',
        notes: '',
      });
      setShowAddForm(false);
    } catch (error) {
      toast.error('Failed to add record');
    }
  };

  const handleReturn = async () => {
    if (!returnRecord || !returnAmount) return;
    try {
      await recordReturn(returnRecord.id, returnAmount);
      toast.success('Return recorded!');
      setReturnRecord(null);
      setReturnAmount('');
    } catch (error) {
      toast.error(error.message || 'Failed to record return');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRecord(deleteId);
      toast.success('Record deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const totalOutstanding = records.reduce((sum, r) => sum + r.remaining, 0);

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {records.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
          </CardContent>
        </Card>
      )}

      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Record Money Lent
        </Button>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record Money Lent</CardTitle>
            <CardDescription>Track money you lent to others</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="personName">Person Name *</Label>
                <Input
                  id="personName"
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  placeholder="e.g., Rahul"
                />
              </div>

              <CurrencyInput
                label="Amount Lent *"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
              />

              <div className="space-y-2">
                <Label htmlFor="lentDate">Date Lent</Label>
                <Input
                  id="lentDate"
                  type="date"
                  value={formData.lentDate}
                  onChange={(e) => setFormData({ ...formData, lentDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedReturnDate">Expected Return (optional)</Label>
                <Input
                  id="expectedReturnDate"
                  type="date"
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {records.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No Money Lent"
          description="Track money you lent to friends or family"
        />
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{record.personName}</p>
                    <p className="text-sm text-muted-foreground">
                      Lent {formatCurrency(record.amount)} · {formatDate(record.lentDate.toDate?.() || record.lentDate, 'short')}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      Remaining: {formatCurrency(record.remaining)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {record.remaining > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setReturnRecord(record)}>
                        Return
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(record.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {record.remaining === 0 && (
                  <Badge variant="success" className="mt-2">Fully Returned ✓</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!returnRecord} onOpenChange={(open) => !open && setReturnRecord(null)}>
        <DialogContent onClose={() => setReturnRecord(null)}>
          <DialogHeader>
            <DialogTitle>Record Return</DialogTitle>
            <DialogDescription>
              How much did {returnRecord?.personName} return?
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <CurrencyInput
              label="Return Amount"
              value={returnAmount}
              onChange={setReturnAmount}
            />
            <Button className="w-full" onClick={handleReturn}>
              <DollarSign className="h-4 w-4 mr-2" />
              Confirm Return
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Record?"
        description="This lent money record will be removed."
        confirmText="Delete"
      />
    </div>
  );
};
