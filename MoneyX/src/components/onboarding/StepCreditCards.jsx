import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Plus, Trash2, CreditCard } from 'lucide-react';

const CARD_COLORS = [
  { value: '#4ECDC4', label: 'Teal' },
  { value: '#FF6B6B', label: 'Red' },
  { value: '#95E1D3', label: 'Mint' },
  { value: '#F38181', label: 'Pink' },
  { value: '#AA96DA', label: 'Purple' },
  { value: '#FCBAD3', label: 'Light Pink' },
];

export const StepCreditCards = ({ onNext, onBack, initialData = {} }) => {
  const [cards, setCards] = useState(initialData.cards || []);
  const [newCard, setNewCard] = useState({
    name: '',
    limit: '',
    color: CARD_COLORS[0].value,
  });

  const addCard = () => {
    if (!newCard.name || !newCard.limit || parseFloat(newCard.limit) <= 0) {
      alert('Please enter valid card details');
      return;
    }

    setCards([
      ...cards,
      {
        id: Date.now(),
        name: newCard.name,
        limit: parseFloat(newCard.limit),
        color: newCard.color,
      },
    ]);
    setNewCard({ name: '', limit: '', color: CARD_COLORS[0].value });
  };

  const removeCard = (id) => {
    setCards(cards.filter((card) => card.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ cards });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Credit Cards</h2>
        <p className="text-muted-foreground">
          Add your credit cards to track spending
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Credit Card</CardTitle>
          <CardDescription>
            We'll help you track your credit card bills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardName">Card Name</Label>
            <Input
              id="cardName"
              placeholder="e.g., Visa Card, Mastercard Gold"
              value={newCard.name}
              onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
            />
          </div>

          <CurrencyInput
            label="Credit Limit"
            placeholder="0"
            value={newCard.limit}
            onChange={(value) => setNewCard({ ...newCard, limit: value })}
          />

          <div className="space-y-2">
            <Label>Card Color</Label>
            <div className="flex gap-2">
              {CARD_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setNewCard({ ...newCard, color: color.value })}
                  className={`h-10 w-10 rounded-full transition-all ${
                    newCard.color === color.value ? 'ring-4 ring-primary ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <Button
            type="button"
            onClick={addCard}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </CardContent>
      </Card>

      {cards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Credit Cards</CardTitle>
            <CardDescription>{cards.length} card(s) added</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor: card.color }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: card.color + '20' }}
                    >
                      <CreditCard className="h-5 w-5" style={{ color: card.color }} />
                    </div>
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Limit: ৳{card.limit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCard(card.id)}
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
          {cards.length > 0 ? 'Continue' : 'Skip'}
        </Button>
      </div>
    </form>
  );
};