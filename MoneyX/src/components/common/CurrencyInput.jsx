import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const CurrencyInput = React.forwardRef(
  ({ label, error, className, value, onChange, ...props }, ref) => {
    const handleChange = (e) => {
      const val = e.target.value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = val.split('.');
      const formatted = parts.length > 2 
        ? parts[0] + '.' + parts.slice(1).join('')
        : val;
      onChange?.(formatted);
    };

    return (
      <div className={cn('space-y-2', className)}>
        {label && <Label>{label}</Label>}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ৳
          </span>
          <Input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            className={cn('pl-8', error && 'border-destructive')}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';