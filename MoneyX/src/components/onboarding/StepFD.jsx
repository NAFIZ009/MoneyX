import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

export const StepFD = ({ onNext, onBack, initialData = {} }) => {
  const [fdAccounts, setFdAccounts] = useState(initialData.fdAccounts || []);
  const [newFD, setNewFD] = useState({
    name: '',
    amount: '',
  });

  const addFD = () => {
    if (!newFD.name || !newFD.amount || parseFloat(newFD.amount) <= 0) {
      alert('Please enter valid FD details');
      return;
    }

    setFdAccounts([
      ...fdAccounts,
      {
        id: Date.now(),
        name: newFD.name,
        amount: parseFloat(newFD.amount),
      },
    ]);
    setNewFD({ name: '', amount: '' });
  };

  const removeFD = (id) => {
    setFdAccounts(fdAccounts.filter((fd) => fd.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ fdAccounts });
  };

  const totalFD = fdAccounts.reduce((sum, fd) => sum + fd.amount, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Fixed Deposits</h2>
        <p className="text-muted-foreground">
          Add your fixed deposit accounts (optional)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add FD Account</CardTitle>
          <CardDescription>Track your fixed deposit investments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fdName">FD Name</Label>
            <Input
              id="fdName"
              placeholder="e.g., 5-Year FD, Emergency Fund"
              value={newFD.name}
              onChange={(e) => setNewFD({ ...newFD, name: e.target.value })}
            />
          </div>

          <CurrencyInput
            label="Amount"
            placeholder="0"
            value={newFD.amount}
            onChange={(value) => setNewFD({ ...newFD, amount: value })}
          />

          <Button
            type="button"
            onClick={addFD}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add FD
          </Button>
        </CardContent>
      </Card>

      {fdAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your FD Accounts</CardTitle>
            <CardDescription>
              Total: ৳{totalFD.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fdAccounts.map((fd) => (
                <div
                  key={fd.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{fd.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ৳{fd.amount.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFD(fd.id)}
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
          {fdAccounts.length > 0 ? 'Continue' : 'Skip'}
        </Button>
      </div>
    </form>
  );
};