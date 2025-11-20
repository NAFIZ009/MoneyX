import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthKey } from '@/lib/utils';
import { CreditCard, ChevronRight } from 'lucide-react';

export const CreditCardSummary = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCards();
    }
  }, [user]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const monthKey = getMonthKey();
      const cardsQuery = query(
        collection(db, `users/${user.uid}/creditCards`),
        where('isActive', '==', true)
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      const cardsWithBills = await Promise.all(
        cardsSnapshot.docs.map(async (cardDoc) => {
          const card = cardDoc.data();
          const billRef = doc(
            db,
            `users/${user.uid}/creditCards/${cardDoc.id}/bills/${monthKey}`
          );
          const billDoc = await getDoc(billRef);

          const bill = billDoc.exists()
            ? billDoc.data()
            : { totalPending: 0, thisMonthTransactions: 0 };

          return {
            id: cardDoc.id,
            ...card,
            ...bill,
          };
        })
      );

      setCards(cardsWithBills);
    } catch (error) {
      console.error('Error loading credit cards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (cards.length === 0) {
    return null;
  }

  const totalPending = cards.reduce((sum, card) => sum + (card.totalPending || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Credit Cards</CardTitle>
            <CardDescription>
              {formatCurrency(totalPending)} pending
            </CardDescription>
          </div>
          <Badge variant={totalPending > 0 ? 'warning' : 'success'}>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {cards.slice(0, 2).map((card) => (
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
                <p className="font-medium text-sm">{card.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(card.totalPending || 0)} pending
                </p>
              </div>
            </div>
            {card.thisMonthTransactions > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{formatCurrency(card.thisMonthTransactions)}
              </Badge>
            )}
          </div>
        ))}

        {cards.length > 2 && (
          <button
            onClick={() => (window.location.href = '/management')}
            className="w-full flex items-center justify-center gap-1 text-sm text-primary hover:underline py-2"
          >
            View all cards
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
};