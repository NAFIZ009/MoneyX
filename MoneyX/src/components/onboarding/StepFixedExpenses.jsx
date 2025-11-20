import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Plus, Trash2, Receipt } from 'lucide-react';

export const StepFixedExpenses = ({ onNext, onBack, initialData = {} }) => {
  const [expenses, setExpenses] = useState(initialData.expenses || []);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '' });

  const addExpense = () => {
    if (!newExpense.name || !newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      alert('Please enter valid expense details');
      return;
    }

    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        name: newExpense.name,
        amount: parseFloat(newExpense.amount),
      },
    ]);
    setNewExpense({ name: '', amount: '' });
  };

  const removeExpense = (id) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ expenses });
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Receipt className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Fixed Monthly Expenses</h2>
        <p className="text-muted-foreground">
          Add expenses you pay every month (rent, bills, subscriptions)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Expense</CardTitle>
          <CardDescription>
            These will be deducted from your salary automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expenseName">Expense Name</Label>
            <Input
              id="expenseName"
              placeholder="e.g., Rent, Netflix, Internet"
              value={newExpense.name}
              onChange={(e) =>
                setNewExpense({ ...newExpense, name: e.target.value })
              }
            />
          </div>

          <CurrencyInput
            label="Amount"
            placeholder="0"
            value={newExpense.amount}
            onChange={(value) =>
              setNewExpense({ ...newExpense, amount: value })
            }
          />

          <Button
            type="button"
            onClick={addExpense}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </CardContent>
      </Card>

      {expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Fixed Expenses</CardTitle>
            <CardDescription>Total: ৳{totalExpenses.toLocaleString()}/month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{expense.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ৳{expense.amount.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExpense(expense.id)}
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
          Continue
        </Button>
      </div>
    </form>
  );
};