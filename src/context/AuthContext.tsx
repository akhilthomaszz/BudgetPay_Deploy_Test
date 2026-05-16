import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { FirestoreService } from '../lib/firestoreService';
import { serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ensure user doc exists
        const userDoc = await FirestoreService.getDocument(FirestoreService.getUsersPath(), currentUser.uid);
        if (!userDoc) {
          await FirestoreService.createDocument(FirestoreService.getUsersPath(), currentUser.uid, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            monthlyBudget: 20000, // Default
            currency: 'INR',
            createdAt: serverTimestamp(),
          });
          
          // Seed default categories
          const catsPath = FirestoreService.getCategoriesPath(currentUser.uid);
          const defaults = [
            { name: 'Groceries', icon: 'soup', color: '#EF9F27', monthlyLimit: 8000, spent: 3200 },
            { name: 'Transport', icon: 'car', color: '#378ADD', monthlyLimit: 4000, spent: 1200 },
            { name: 'Shopping', icon: 'shopping-bag', color: '#E24B4A', monthlyLimit: 5000, spent: 4100 },
            { name: 'Dining', icon: 'tools-kitchen-2', color: '#1D9E75', monthlyLimit: 3000, spent: 850 },
          ];
          
          const categoryMap: Record<string, string> = {};
          for (const cat of defaults) {
            const id = Math.random().toString(36).substring(7);
            categoryMap[cat.name] = id;
            await FirestoreService.createDocument(catsPath, id, { 
              ...cat, 
              userId: currentUser.uid,
            });
          }

          // Seed default goals
          const goalsPath = FirestoreService.getGoalsPath(currentUser.uid);
          const defaultGoals = [
            { title: 'Japan Trip 2025', targetAmount: 150000, currentAmount: 45000, deadline: new Date('2025-12-31'), icon: 'plane', color: '#378ADD', status: 'active' },
            { title: 'New MacBook Pro', targetAmount: 129900, currentAmount: 12000, deadline: new Date('2025-09-30'), icon: 'laptop', color: '#EF9F27', status: 'active' },
            { title: 'Emergency Fund', targetAmount: 50000, currentAmount: 38000, deadline: new Date('2025-06-30'), icon: 'shield-check', color: '#1D9E75', status: 'active' },
            { title: 'Bike Down Payment', targetAmount: 40000, currentAmount: 15000, deadline: new Date('2025-08-15'), icon: 'target', color: '#E24B4A', status: 'active' },
          ];
          for (const goal of defaultGoals) {
            const id = Math.random().toString(36).substring(7);
            await FirestoreService.createDocument(goalsPath, id, { 
              ...goal, 
              userId: currentUser.uid,
            });
          }


          // Seed dummy transactions
          const txsPath = FirestoreService.getTransactionsPath(currentUser.uid);
          const dummyTxs = [
            { amount: 850, categoryId: categoryMap['Groceries'], categoryName: 'Groceries', note: 'Weekly veggies', date: new Date(), receiverName: 'Organic Store', method: 'GPay' },
            { amount: 120, categoryId: categoryMap['Transport'], categoryName: 'Transport', note: 'Metro recharge', date: new Date(Date.now() - 86400000), receiverName: 'Delhi Metro', method: 'PhonePe' },
            { amount: 1299, categoryId: categoryMap['Shopping'], categoryName: 'Shopping', note: 'New Sneakers', date: new Date(Date.now() - 172800000), receiverName: 'Amazon', method: 'GPay' },
            { amount: 450, categoryId: categoryMap['Dining'], categoryName: 'Dining', note: 'Weekend brunch', date: new Date(Date.now() - 259200000), receiverName: 'The Breakfast Club', method: 'Paytm' },
            { amount: 2400, categoryId: categoryMap['Groceries'], categoryName: 'Groceries', note: 'Monthly pantry', date: new Date(Date.now() - 345600000), receiverName: 'Swiggy Instamart', method: 'GPay' },
            { amount: 65, categoryId: categoryMap['Transport'], categoryName: 'Transport', note: 'Rickshaw', date: new Date(Date.now() - 432000000), receiverName: 'Auto Driver', method: 'Paytm' },
            { amount: 210, categoryId: categoryMap['Dining'], categoryName: 'Dining', note: 'Lunch', date: new Date(Date.now() - 518400000), receiverName: 'Udupi Garden', method: 'PhonePe' },
          ];
          for (const tx of dummyTxs) {
            const id = Math.random().toString(36).substring(7);
            await FirestoreService.createDocument(txsPath, id, { 
              ...tx, 
              userId: currentUser.uid,
            });
          }
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const logOut = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
