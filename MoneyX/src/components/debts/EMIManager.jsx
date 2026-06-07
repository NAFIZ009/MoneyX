import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/common/Toast';
import { useEMIs } from '@/hooks/useEMIs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const EMI_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'other', label: 'Other' },
];

export const EMIManager = () => {
  const { emis, loading, addEMI, recordPayment, deleteEMI } = useEMIs();
  const toast = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'electronics',
    storeName: '',
    totalPrice: '',
    downPayment: '',
    totalInstallments: '',
    interestRate: '0',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.itemName || !formData.totalPrice || !formData.totalInstallments) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addEMI(formData);
      toast.success('EMI added successfully!');
      setFormData({
        itemName: '',
        category: 'electronics',
        storeName: '',
        totalPrice: '',
        downPayment: '',
        totalInstallments: '',
        interestRate: '0',
        startDate: new Date().toISOString().split('T')[0],
      });
      setShowAddForm(false);
    } catch (error) {
      toast.error('Failed to add EMI');
    }
  };

  const handlePayment = async () => {
    if (!paymentId) return;
    try {
      await recordPayment(paymentId);
      toast.success('EMI payment recorded!');
      setPaymentId(null);
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEMI(deleteId);
      toast.success('EMI deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete EMI');
    }
  };

  const totalDebt = emis.reduce((sum, emi) => sum + (emi.remainingBalance || 0), 0);
  const monthlyPayment = emis.reduce((sum, emi) => sum + (emi.emiAmount || 0), 0);

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {emis.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total EMI Debt</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly EMI</p>
                <p className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add EMI Purchase
        </Button>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add EMI Purchase</CardTitle>
            <CardDescription>Track buy-now-pay-later purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g., iPhone 15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {EMI_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <CurrencyInput
                label="Total Price *"
                value={formData.totalPrice}
                onChange={(value) => setFormData({ ...formData, totalPrice: value })}
              />

              <CurrencyInput
                label="Down Payment"
                value={formData.downPayment}
                onChange={(value) => setFormData({ ...formData, downPayment: value })}
              />

              <div className="space-y-2">
                <Label htmlFor="totalInstallments">Installments (months) *</Label>
                <Input
                  id="totalInstallments"
                  type="number"
                  value={formData.totalInstallments}
                  onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                  placeholder="12"
                />
              </div>

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
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full">Add EMI</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {emis.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No EMIs"
          description="Track installment purchases like phones, laptops, or furniture"
        />
      ) : (
        <div className="space-y-2">
          {emis.map((emi) => {
            const pct = Math.round(((emi.installmentsPaid || 0) / emi.totalInstallments) * 100);
            return (
              <Card key={emi.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{emi.itemName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {emi.storeName || EMI_CATEGORIES.find(c => c.value === emi.category)?.label}
                        {' · '}{emi.totalInstallments} months
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(emi.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-bold text-red-600">{formatCurrency(emi.remainingBalance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly EMI</p>
                      <p className="font-bold">{formatCurrency(emi.emiAmount)}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{emi.installmentsPaid || 0} / {emi.totalInstallments} paid</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {emi.nextDueDate && emi.remainingBalance > 0 && (
                    <div className="flex items-center gap-2 text-sm p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span>Next: {formatDate(emi.nextDueDate)}</span>
                    </div>
                  )}

                  {emi.remainingBalance > 0 ? (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setPaymentId(emi.id)}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Record Payment ({formatCurrency(emi.emiAmount)})
                    </Button>
                  ) : (
                    <Badge variant="success" className="w-full justify-center">Fully Paid ✓</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!paymentId}
        onOpenChange={(open) => !open && setPaymentId(null)}
        onConfirm={handlePayment}
        title="Record EMI Payment?"
        description="This will mark one installment as paid."
        confirmText="Record Payment"
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete EMI?"
        description="This EMI will be removed from your records."
        confirmText="Delete"
      />
    </div>
  );
};
