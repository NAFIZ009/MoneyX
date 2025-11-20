import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export const useCreditCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    loadCards();
  }, [user]);

  const loadCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, `users/${user.uid}/creditCards`),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const cardsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCards(cardsData);
    } catch (err) {
      console.error('Error loading credit cards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCard = async (cardData) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const newCard = {
        name: cardData.name,
        limit: parseFloat(cardData.limit),
        color: cardData.color || '#4ECDC4',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, `users/${user.uid}/creditCards`), newCard);
      await loadCards();
    } catch (err) {
      console.error('Error adding credit card:', err);
      throw err;
    }
  };

  const updateCard = async (cardId, updates) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const cardRef = doc(db, `users/${user.uid}/creditCards/${cardId}`);
      await updateDoc(cardRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      await loadCards();
    } catch (err) {
      console.error('Error updating credit card:', err);
      throw err;
    }
  };

  const deleteCard = async (cardId) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Soft delete
      const cardRef = doc(db, `users/${user.uid}/creditCards/${cardId}`);
      await updateDoc(cardRef, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      await loadCards();
    } catch (err) {
      console.error('Error deleting credit card:', err);
      throw err;
    }
  };

  return {
    cards,
    loading,
    error,
    addCard,
    updateCard,
    deleteCard,
    refreshCards: loadCards,
  };
};