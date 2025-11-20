import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { EXPENSE_CATEGORIES } from '@/lib/categories';
import { Filter } from 'lucide-react';

export const ExpenseFilters = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="categoryFilter" className="text-xs">Category</Label>
            <Select
              id="categoryFilter"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label htmlFor="dateFilter" className="text-xs">Date Range</Label>
            <Select
              id="dateFilter"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
            </Select>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-2">
            <Label htmlFor="paymentFilter" className="text-xs">Payment</Label>
            <Select
              id="paymentFilter"
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash Only</option>
              <option value="card">Credit Card</option>
            </Select>
          </div>
        </div>

        {/* Active Filters Count */}
        {(filters.category !== 'all' ||
          filters.dateRange !== 'all' ||
          filters.paymentMethod !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Filters active
            </p>
            <button
              onClick={() =>
                onFiltersChange({
                  category: 'all',
                  dateRange: 'all',
                  paymentMethod: 'all',
                })
              }
              className="text-xs text-primary hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};