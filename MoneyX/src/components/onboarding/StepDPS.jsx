import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Plus, Trash2, PiggyBank } from 'lucide-react';

export const StepDPS = ({ onNext, onBack, initialData = {} }) => {
  const [dpsAccounts, setDpsAccounts] = useState(initialData.dpsAccounts || []);
  const [newDPS, setNewDPS] = useState({
    name: '',
    monthlyAmount: '',
    installmentsPaid: '',
  });

  const addDPS = () => {
    if (!newDPS.name || !newDPS.monthlyAmount || parseFloat(newDPS.monthlyAmount) <= 0) {
      alert('Please enter valid DPS details');
      return;
    }

    setDpsAccounts([
      ...dpsAccounts,
      {
        id: Date.now(),
        name: newDPS.name,
        monthlyAmount: parseFloat(newDPS.monthlyAmount),
        installmentsPaid: parseInt(newDPS.installmentsPaid) || 0,
      },
    ]);
    setNewDPS({ name: '', monthlyAmount: '', installmentsPaid: '' });
  };

  const removeDPS = (id) => {
    setDpsAccounts(dpsAccounts.filter((dps) => dps.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ dpsAccounts });
  };

  const totalDPS = dpsAccounts.reduce((sum, dps) => sum + dps.monthlyAmount, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <PiggyBank className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">DPS Accounts</h2>
        <p className="text-muted-foreground">
          Add your Deposit Pension Scheme accounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add DPS Account</CardTitle>
          <CardDescription>
            Track your monthly DPS installments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dpsName">DPS Name</Label>
            <Input
              id="dpsName"
              placeholder="e.g., City Bank DPS, My Savings Plan"
              value={newDPS.name}
              onChange={(e) => setNewDPS({ ...newDPS, name: e.target.value })}
            />
          </div>

          <CurrencyInput
            label="Monthly Installment"
            placeholder="0"
            value={newDPS.monthlyAmount}
            onChange={(value) =>
              setNewDPS({ ...newDPS, monthlyAmount: value })
            }
          />

          <div className="space-y-2">
            <Label htmlFor="installmentsPaid">Installments Already Paid</Label>
            <Input
              id="installmentsPaid"
              type="number"
              placeholder="0"
              value={newDPS.installmentsPaid}
              onChange={(e) =>
                setNewDPS({ ...newDPS, installmentsPaid: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              How many months have you already paid?
            </p>
          </div>

          <Button
            type="button"
            onClick={addDPS}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add DPS
          </Button>
        </CardContent>
      </Card>

      {dpsAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your DPS Accounts</CardTitle>
            <CardDescription>
              Total: ৳{totalDPS.toLocaleString()}/month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dpsAccounts.map((dps) => (
                <div
                  key={dps.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{dps.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ৳{dps.monthlyAmount.toLocaleString()}/month
                    </p>
                    {dps.installmentsPaid > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {dps.installmentsPaid} installments paid
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDPS(dps.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="w-full">
          Back
        </Button>
        <Button type="submit" className="w-full">
          {dpsAccounts.length > 0 ? 'Continue' : 'Skip'}
        </Button>
      </div>
    </form>
  );
};