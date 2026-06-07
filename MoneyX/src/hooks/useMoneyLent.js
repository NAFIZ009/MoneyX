import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export const useMoneyLent = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }
    loadRecords();
  }, [user]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, `users/${user.uid}/moneyLent`),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      setRecords(
        snapshot.docs.map(d => {
          const data = d.data();
          const amount = parseFloat(data.amount) || 0;
          const returned = parseFloat(data.amountReturned) || 0;
          return {
            id: d.id,
            ...data,
            amount,
            amountReturned: returned,
            remaining: Math.max(0, amount - returned),
          };
        })
      );
    } catch (err) {
      console.error('Error loading money lent:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async (data) => {
    if (!user) throw new Error('User not authenticated');

    await addDoc(collection(db, `users/${user.uid}/moneyLent`), {
      personName: data.personName,
      amount: parseFloat(data.amount),
      amountReturned: 0,
      lentDate: Timestamp.fromDate(new Date(data.lentDate)),
      expectedReturnDate: data.expectedReturnDate
        ? Timestamp.fromDate(new Date(data.expectedReturnDate))
        : null,
      notes: data.notes || '',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await loadRecords();
  };

  const recordReturn = async (recordId, returnAmount) => {
    if (!user) throw new Error('User not authenticated');

    const record = records.find(r => r.id === recordId);
    if (!record) throw new Error('Record not found');

    const amount = parseFloat(returnAmount);
    if (isNaN(amount) || amount <= 0) throw new Error('Invalid return amount');

    const newReturned = record.amountReturned + amount;
    if (newReturned > record.amount) throw new Error('Return exceeds lent amount');

    await updateDoc(doc(db, `users/${user.uid}/moneyLent/${recordId}`), {
      amountReturned: newReturned,
      updatedAt: Timestamp.now(),
    });

    await loadRecords();
  };

  const deleteRecord = async (recordId) => {
    if (!user) throw new Error('User not authenticated');

    await updateDoc(doc(db, `users/${user.uid}/moneyLent/${recordId}`), {
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    await loadRecords();
  };

  return {
    records,
    loading,
    error,
    addRecord,
    recordReturn,
    deleteRecord,
    refreshRecords: loadRecords,
  };
};
