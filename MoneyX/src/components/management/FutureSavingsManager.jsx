import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Target, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const FutureSavingsManager = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
  });

  useEffect(() => {
    if (user) {
      loadSavings();
    }
  }, [user]);

  const loadSavings = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, `users/${user.uid}/futureSavings`),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const savingsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSavings(savingsData);
    } catch (error) {
      console.error('Error loading savings:', error);
      toast.error('Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter valid savings goal details');
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/futureSavings`), {
        name: formData.name,
        targetAmount: parseFloat(formData.amount),
        allocatedAmount: parseFloat(formData.amount),
        targetMonth: new Date().toISOString().slice(0, 7),
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success('Savings goal added successfully!');
      setFormData({ name: '', amount: '' });
      setShowAddForm(false);
      await loadSavings();
    } catch (error) {
      console.error('Error adding savings:', error);
      toast.error('Failed to add savings goal');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await updateDoc(doc(db, `users/${user.uid}/futureSavings/${deleteId}`), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      toast.success('Savings goal deleted successfully');
      setDeleteId(null);
      await loadSavings();
    } catch (error) {
      console.error('Error deleting savings:', error);
      toast.error('Failed to delete savings goal');
    }
  };

  const totalAllocated = savings.reduce((sum, saving) => sum + saving.allocatedAmount, 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {savings.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reserved</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAllocated)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Goals</p>
                <p className="text-2xl font-bold">{savings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Savings Goal
        </Button>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Savings Goal</CardTitle>
            <CardDescription>
              Reserve money for upcoming expenses or special purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Winter Shopping, Kaptai Trip"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <CurrencyInput
                label="Amount to Reserve"
                placeholder="0"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', amount: '' });
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full">
                  Add Goal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Savings List */}
      {savings.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No Savings Goals"
          description="Set aside money for future expenses like trips, shopping, or special occasions"
        />
      ) : (
        <div className="space-y-2">
          {savings.map((saving) => (
            <Card key={saving.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{saving.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Reserved: {formatCurrency(saving.allocatedAmount)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(saving.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Savings Goal?"
        description="This goal will be removed and the reserved amount will be freed up."
        confirmText="Delete"
      />
    </div>
  );
};