import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const PaymentMethodDialog = ({
  open,
  onOpenChange,
  obligation,
  creditCards,
  onConfirm,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCardId, setSelectedCardId] = useState(creditCards[0]?.id || '');

  const handleConfirm = () => {
    onConfirm({
      paymentMethod,
      creditCardId: paymentMethod === 'credit' ? selectedCardId : null,
    });
    onOpenChange(false);
    // Reset for next time
    setPaymentMethod('cash');
    setSelectedCardId(creditCards[0]?.id || '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Method</DialogTitle>
          <DialogDescription>
            How did you pay for {obligation?.name}?
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 pt-2 sm:pt-4 space-y-4">
          {/* Amount Display */}
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-2xl font-bold">{formatCurrency(obligation?.amount || 0)}</p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            
            {/* Cash Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                paymentMethod === 'cash'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                paymentMethod === 'cash' ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <Wallet className={`h-5 w-5 ${
                  paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">Cash Payment</p>
                <p className="text-sm text-muted-foreground">
                  Paid from your wallet/bank
                </p>
              </div>
              {paymentMethod === 'cash' && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                  </svg>
                </div>
              )}
            </button>

            {/* Credit Card Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod('credit')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                paymentMethod === 'credit'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              disabled={creditCards.length === 0}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                paymentMethod === 'credit' ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <CreditCard className={`h-5 w-5 ${
                  paymentMethod === 'credit' ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">Credit Card</p>
                <p className="text-sm text-muted-foreground">
                  {creditCards.length > 0 
                    ? 'Add to card bill' 
                    : 'No cards available'}
                </p>
              </div>
              {paymentMethod === 'credit' && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* Credit Card Selection */}
          {paymentMethod === 'credit' && creditCards.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="creditCard">Select Credit Card</Label>
              <Select
                id="creditCard"
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
              >
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </Select>

              <Alert>
                <AlertDescription className="text-xs">
                  💡 This amount will be added to your card bill and returned to your expendables
                </AlertDescription>
              </Alert>
            </div>
          )}

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
              disabled={paymentMethod === 'credit' && !selectedCardId}
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};