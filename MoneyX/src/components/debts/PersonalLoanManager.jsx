import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { usePersonalLoans } from '@/hooks/usePersonalLoans';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, Wallet, DollarSign, Calendar, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LOAN_TYPES = [
  { value: 'personal', label: 'Personal Loan' },
  { value: 'bank', label: 'Bank Loan' },
  { value: 'emergency', label: 'Emergency Loan' },
  { value: 'education', label: 'Education Loan' },
  { value: 'business', label: 'Business Loan' },
  { value: 'other', label: 'Other' },
];

export const PersonalLoanManager = () => {
  const { loans, loading, addLoan, recordPayment, deleteLoan } = usePersonalLoans();
  const toast = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [paymentLoanId, setPaymentLoanId] = useState(null);
  const [formData, setFormData] = useState({
    lenderName: '',
    loanType: 'personal',
    principalAmount: '',
    interestRate: '',
    loanTermMonths: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.lenderName || !formData.principalAmount || !formData.loanTermMonths) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.principalAmount) <= 0) {
      toast.error('Loan amount must be greater than 0');
      return;
    }

    if (parseInt(formData.loanTermMonths) <= 0) {
      toast.error('Loan term must be greater than 0');
      return;
    }

    try {
      await addLoan(formData);
      toast.success('Loan added successfully!');
      setFormData({
        lenderName: '',
        loanType: 'personal',
        principalAmount: '',
        interestRate: '',
        loanTermMonths: '',
        startDate: new Date().toISOString().split('T')[0],
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding loan:', error);
      toast.error('Failed to add loan');
    }
  };

  const handlePayment = async () => {
    if (!paymentLoanId) return;

    try {
      await recordPayment(paymentLoanId);
      toast.success('Payment recorded successfully!');
      setPaymentLoanId(null);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteLoan(deleteId);
      toast.success('Loan deleted successfully');
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast.error('Failed to delete loan');
    }
  };

  const totalDebt = loans.reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0);
  const monthlyPayment = loans.reduce((sum, loan) => sum + (loan.emi || 0), 0);

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
      {loans.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Debt</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Personal Loan
        </Button>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Personal Loan</CardTitle>
            <CardDescription>Track money you borrowed</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lenderName">Lender Name *</Label>
                <Input
                  id="lenderName"
                  placeholder="e.g., BRAC Bank, Uncle Ahmed"
                  value={formData.lenderName}
                  onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanType">Loan Type</Label>
                <Select
                  id="loanType"
                  value={formData.loanType}
                  onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                >
                  {LOAN_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>

              <CurrencyInput
                label="Loan Amount *"
                placeholder="0"
                value={formData.principalAmount}
                onChange={(value) => setFormData({ ...formData, principalAmount: value })}
              />

              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (% per year)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Leave 0 for interest-free loans</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanTermMonths">Loan Term (months) *</Label>
                <Input
                  id="loanTermMonths"
                  type="number"
                  placeholder="12"
                  value={formData.loanTermMonths}
                  onChange={(e) => setFormData({ ...formData, loanTermMonths: e.target.value })}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      lenderName: '',
                      loanType: 'personal',
                      principalAmount: '',
                      interestRate: '',
                      loanTermMonths: '',
                      startDate: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full">
                  Add Loan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Loans List */}
      {loans.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No Loans"
          description="Track personal loans, bank loans, or money borrowed from friends/family"
        />
      ) : (
        <div className="space-y-2">
          {loans.map((loan) => {
            const completionPercentage = Math.round(
              ((loan.paymentsMade || 0) / loan.loanTermMonths) * 100
            );

            return (
              <Card key={loan.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{loan.lenderName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {LOAN_TYPES.find(t => t.value === loan.loanType)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {loan.interestRate}% interest • {loan.loanTermMonths} months
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(loan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <TrendingDown className="h-3 w-3" />
                          Remaining
                        </div>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(loan.remainingBalance)}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <DollarSign className="h-3 w-3" />
                          Monthly EMI
                        </div>
                        <p className="text-lg font-bold">
                          {formatCurrency(loan.emi)}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {loan.paymentsMade || 0} / {loan.loanTermMonths} paid
                        </span>
                        <span className="font-medium">{completionPercentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Next Due Date */}
                    {loan.nextDueDate && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-900 dark:text-orange-100">
                          Next payment: {formatDate(loan.nextDueDate)}
                        </span>
                      </div>
                    )}

                    {/* Pay Button */}
                    {loan.remainingBalance > 0 && (
                      <Button
                        onClick={() => setPaymentLoanId(loan.id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Record Payment ({formatCurrency(loan.emi)})
                      </Button>
                    )}

                    {loan.remainingBalance === 0 && (
                      <Badge variant="success" className="w-full justify-center">
                        Fully Paid ✓
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Confirmation Dialog */}
      <ConfirmDialog
        open={!!paymentLoanId}
        onOpenChange={(open) => !open && setPaymentLoanId(null)}
        onConfirm={handlePayment}
        title="Record Payment?"
        description={`This will mark one installment as paid for ${
          loans.find(l => l.id === paymentLoanId)?.lenderName
        }.`}
        confirmText="Record Payment"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Loan?"
        description="This loan will be removed from your records."
        confirmText="Delete"
      />
    </div>
  );
};