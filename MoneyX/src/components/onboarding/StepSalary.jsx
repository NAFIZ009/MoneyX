import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Banknote } from 'lucide-react';

export const StepSalary = ({ onNext, initialData = {} }) => {
  const [formData, setFormData] = useState({
    isFixed: initialData.isFixed ?? true,
    fixedAmount: initialData.fixedAmount || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.isFixed && (!formData.fixedAmount || parseFloat(formData.fixedAmount) <= 0)) {
      alert('Please enter a valid salary amount');
      return;
    }

    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Banknote className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Salary Information</h2>
        <p className="text-muted-foreground">
          Tell us about your monthly income
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Salary</CardTitle>
          <CardDescription>
            Do you receive a fixed salary every month?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFixed"
              checked={formData.isFixed}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isFixed: checked })
              }
            />
            <Label htmlFor="isFixed" className="cursor-pointer">
              I receive a fixed monthly salary
            </Label>
          </div>

          {formData.isFixed && (
            <CurrencyInput
              label="Fixed Monthly Amount"
              placeholder="0"
              value={formData.fixedAmount}
              onChange={(value) =>
                setFormData({ ...formData, fixedAmount: value })
              }
            />
          )}

          {!formData.isFixed && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              💡 You can add your salary manually each month when it arrives
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg">
        Continue
      </Button>
    </form>
  );
};