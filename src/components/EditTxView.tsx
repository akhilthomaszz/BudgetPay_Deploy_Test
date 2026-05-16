import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { FirestoreService } from '../lib/firestoreService';
import { Transaction } from '../types';
import { serverTimestamp } from 'firebase/firestore';

export function EditTxView({ transactionId, onBack }: { transactionId: string | null, onBack: () => void }) {
  const { transactions, categories, goals } = useBudget();
  const { user } = useAuth();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transactionId) {
      const found = transactions.find(t => t.id === transactionId);
      if (found) {
        setTx(found);
        setNote(found.note || '');
        setAmount(found.amount.toString());
      }
    }
  }, [transactionId, transactions]);

  if (!tx) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const handleUpdate = async () => {
    if (!user || !tx || !amount || Number(amount) <= 0) return;
    setIsSubmitting(true);
    try {
      const newAmount = Number(amount);
      const diff = newAmount - tx.amount;

      // Update related budget or goal
      if (tx.categoryId) {
        const cat = categories.find(c => c.id === tx.categoryId);
        if (cat) {
          await FirestoreService.updateDocument(FirestoreService.getCategoriesPath(user.uid), cat.id, {
            spent: cat.spent + diff,
            updatedAt: serverTimestamp(),
          });
        } else {
          const goal = goals.find(g => g.id === tx.categoryId);
          if (goal) {
            await FirestoreService.updateDocument(FirestoreService.getGoalsPath(user.uid), goal.id, {
              currentAmount: goal.currentAmount + diff,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      await FirestoreService.updateDocument(FirestoreService.getTransactionsPath(user.uid), tx.id, {
        note,
        amount: newAmount,
        updatedAt: serverTimestamp(),
      });
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !tx || !confirm('Delete this transaction?')) return;
    setIsSubmitting(true);
    try {
      // Revert budget spent or goal progress
      if (tx.categoryId) {
        const cat = categories.find(c => c.id === tx.categoryId);
        if (cat) {
          await FirestoreService.updateDocument(FirestoreService.getCategoriesPath(user.uid), cat.id, {
            spent: Math.max(0, cat.spent - tx.amount),
            updatedAt: serverTimestamp(),
          });
        } else {
          const goal = goals.find(g => g.id === tx.categoryId);
          if (goal) {
            await FirestoreService.updateDocument(FirestoreService.getGoalsPath(user.uid), goal.id, {
              currentAmount: Math.max(0, goal.currentAmount - tx.amount),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
      
      await FirestoreService.deleteDocument(FirestoreService.getTransactionsPath(user.uid), tx.id);
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-5 space-y-6 pb-6 pt-2">
      <header className="flex items-center justify-between py-4">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold">Edit Transaction</h2>
        <div className="w-10" />
      </header>

      <div className="bg-blue-50 border border-blue-100 p-5 rounded-[24px] flex flex-col gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Edit Amount (₹)</label>
          <input 
            type="number" 
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-white border border-blue-100 rounded-2xl p-4 text-2xl font-black text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="pt-2 border-t border-blue-100 flex justify-between">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Category</span>
          <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">{tx.categoryName}</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Edit Note</label>
          <input 
            type="text" 
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Add a note..."
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex gap-3">
          <AlertCircle className="text-yellow-600 shrink-0" size={18} />
          <p className="text-[10px] text-yellow-700 font-medium leading-relaxed">
            Updating the amount will automatically adjust your <span className="font-bold">{tx.categoryName}</span> progress.
          </p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleUpdate}
            disabled={isSubmitting || !amount}
            className="w-full bg-black hover:bg-neutral-800 text-white py-5 rounded-[24px] font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <Check size={18} /> Update Transaction
          </button>

          <button 
            onClick={handleDelete}
            disabled={isSubmitting}
            className="w-full bg-white border border-red-100 text-red-600 py-4 rounded-[24px] font-black flex items-center justify-center gap-2 hover:bg-red-50 transition-colors uppercase text-[10px] tracking-widest"
          >
            <Trash2 size={16} /> Delete Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
