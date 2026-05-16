import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot, collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Category, Transaction, Goal, UserProfile, OperationType } from '../types';
import { FirestoreService, handleFirestoreError } from '../lib/firestoreService';

interface BudgetContextType {
  profile: UserProfile | null;
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  loading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setCategories([]);
      setTransactions([]);
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const uid = user.uid;
    const userRef = doc(db, 'users', uid);
    const catsRef = collection(db, 'users', uid, 'categories');
    const txsRef = collection(db, 'users', uid, 'transactions');
    const goalsRef = collection(db, 'users', uid, 'goals');

    const txsQuery = query(txsRef, orderBy('date', 'desc'), limit(50));

    const unsubProfile = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
          createdAt = (createdAt as any).toDate().toISOString();
        } else if (createdAt instanceof Date) {
          createdAt = createdAt.toISOString();
        }
        setProfile({ id: snap.id, ...data, createdAt } as any);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}`));

    const unsubCats = onSnapshot(catsRef, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `categories`));

    const unsubTxs = onSnapshot(txsQuery, (snap) => {
      setTransactions(snap.docs.map(d => {
        const data = d.data();
        let date = data.date;
        if (date && typeof date === 'object' && 'toDate' in date) {
          date = (date as any).toDate().toISOString();
        } else if (date instanceof Date) {
          date = date.toISOString();
        } else if (!date) {
          date = new Date().toISOString();
        }
        return { 
          id: d.id, 
          ...data, 
          date 
        } as Transaction;
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `transactions`));

    const unsubGoals = onSnapshot(goalsRef, (snap) => {
      setGoals(snap.docs.map(d => {
        const data = d.data();
        let deadline = data.deadline;
        if (deadline && typeof deadline === 'object' && 'toDate' in deadline) {
          deadline = (deadline as any).toDate().toISOString();
        } else if (deadline instanceof Date) {
          deadline = deadline.toISOString();
        } else if (!deadline) {
          deadline = new Date().toISOString();
        }
        return { id: d.id, ...data, deadline } as Goal;
      }));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `goals`));

    return () => {
      unsubProfile();
      unsubCats();
      unsubTxs();
      unsubGoals();
    };
  }, [user]);

  return (
    <BudgetContext.Provider value={{ profile, categories, transactions, goals, loading }}>
      {children}
    </BudgetContext.Provider>
  );
}

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) throw new Error('useBudget must be used within BudgetProvider');
  return context;
};
