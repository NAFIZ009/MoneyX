import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Plus, Trash2, Target } from 'lucide-react';

export const StepFutureSavings = ({ onNext, onBack, initialData = {} }) => {
  const [savings, setSavings] = useState(initialData.savings || []);
  const [newSaving, setNewSaving] = useState({
    name: '',
    amount: '',
  });

  const addSaving = () => {
    if (!newSaving.name || !newSaving.amount || parseFloat(newSaving.amount) <= 0) {
      alert('Please enter valid savings goal details');
      return;
    }

    setSavings([
      ...savings,
      {
        id: Date.now(),
        name: newSaving.name,
        amount: parseFloat(newSaving.amount),
      },
    ]);
    setNewSaving({ name: '', amount: '' });
  };

  const removeSaving = (id) => {
    setSavings(savings.filter((saving) => saving.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ savings });
  };

  const totalSavings = savings.reduce((sum, saving) => sum + saving.amount, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Future Savings Goals</h2>
        <p className="text-muted-foreground">
          Set aside money for upcoming expenses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Savings Goal</CardTitle>
          <CardDescription>
            Plan for seasonal expenses, trips, or special purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="savingName">Goal Name</Label>
            <Input
              id="savingName"
              placeholder="e.g., Winter Shopping, Kaptai Trip"
              value={newSaving.name}
              onChange={(e) => setNewSaving({ ...newSaving, name: e.target.value })}
            />
          </div>

          <CurrencyInput
            label="Amount to Reserve"
            placeholder="0"
            value={newSaving.amount}
            onChange={(value) => setNewSaving({ ...newSaving, amount: value })}
          />

          <Button
            type="button"
            onClick={addSaving}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardContent>
      </Card>

      {savings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Savings Goals</CardTitle>
            <CardDescription>
              Total Reserved: ৳{totalSavings.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savings.map((saving) => (
                <div
                  key={saving.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{saving.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ৳{saving.amount.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSaving(saving.id)}
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
          {savings.length > 0 ? 'Continue' : 'Skip'}
        </Button>
      </div>
    </form>
  );
};