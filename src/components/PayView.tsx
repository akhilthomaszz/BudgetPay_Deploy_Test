import React, { useState } from 'react';
import { 
  ArrowLeft, QrCode, Check, AlertTriangle, ExternalLink, 
  LayoutGrid, Target
} from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { getIconById } from '../lib/icons';

import { doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function PayView({ onBack, onComplete }: { onBack: () => void, onComplete: () => void }) {
  const { categories, profile, goals } = useBudget();
  const { user } = useAuth();
  
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState(categories[0]?.id || '');
  const [selectionType, setSelectionType] = useState<'category' | 'goal'>('category');
  const [isProcessing, setIsProcessing] = useState(false);

  const activeGoals = goals.filter(g => !g.status || g.status === 'active');

  const selectedCat = categories.find(c => c.id === selectedId);
  const selectedGoal = activeGoals.find(g => g.id === selectedId);

  const getIcon = (iconId: string, fallback: any) => {
    const Icon = getIconById(iconId || '', fallback);
    return <Icon size={16} />;
  };

  const handleSelect = (id: string, type: 'category' | 'goal') => {
    setSelectedId(id);
    setSelectionType(type);
    
    if (type === 'goal') {
      const goal = activeGoals.find(g => g.id === id);
      if (goal) {
        setAmount(goal.monthlyContribution?.toString() || '0');
        setNote(`Contribution: ${goal.title}`);
      }
    } else {
      const cat = categories.find(c => c.id === id);
      if (cat) {
        setNote('');
      }
    }
  };

  const spentAfter = selectedCat ? selectedCat.spent + Number(amount) : 0;
  const percentAfter = selectedCat ? (spentAfter / selectedCat.monthlyLimit) * 100 : 0;

  const handlePay = async () => {
    if (!user || !amount || Number(amount) <= 0) return;
    
    setIsProcessing(true);
    try {
      const txId = Math.random().toString(36).substring(7);
      const batch = FirestoreService.getBatch();
      
      const txData: any = {
        userId: user.uid,
        amount: Number(amount),
        note,
        date: new Date(),
        receiverName: 'Receiver',
        method: 'GPay',
        createdAt: serverTimestamp(),
      };

      if (selectionType === 'category' && selectedCat) {
        txData.categoryId = selectedCat.id;
        txData.categoryName = selectedCat.name;

        // Update category spent
        const catRef = doc(db, FirestoreService.getCategoriesPath(user.uid), selectedCat.id);
        batch.update(catRef, {
          spent: spentAfter,
          updatedAt: serverTimestamp(),
        });
      } else if (selectionType === 'goal' && selectedGoal) {
        txData.categoryId = selectedGoal.id;
        txData.categoryName = `Goal: ${selectedGoal.title}`;

        // Update goal currentAmount
        const goalRef = doc(db, FirestoreService.getGoalsPath(user.uid), selectedGoal.id);
        batch.update(goalRef, {
          currentAmount: selectedGoal.currentAmount + Number(amount),
          updatedAt: serverTimestamp(),
        });
      }

      const txRef = doc(db, FirestoreService.getTransactionsPath(user.uid), txId);
      batch.set(txRef, txData);

      await batch.commit();
      onComplete();
    } catch (e) {
      console.error("Payment failed", e);
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="px-5 space-y-6 pb-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-brand-gray">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold tracking-tight text-brand-text">Express Pay</h2>
        <div className="w-10" />
      </div>

      {/* Category/Goal Selection at TOP */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest ml-1">Select Budget or Goal</label>
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id, 'category')}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-black border transition-all shrink-0 uppercase tracking-wider flex items-center gap-2",
                selectedId === cat.id && selectionType === 'category'
                  ? "bg-brand-teal border-brand-teal text-white shadow-xl scale-105" 
                  : "bg-white border-brand-gray/10 text-brand-gray hover:border-brand-gray/30"
              )}
            >
              {getIcon(cat.icon, LayoutGrid)}
              {cat.name}
            </button>
          ))}
          <div className="w-px h-8 bg-brand-gray/10 mx-1 shrink-0 self-center" />
          {activeGoals.map(goal => (
            <button
              key={goal.id}
              onClick={() => handleSelect(goal.id, 'goal')}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-black border transition-all shrink-0 uppercase tracking-wider flex items-center gap-2",
                selectedId === goal.id && selectionType === 'goal'
                  ? "bg-brand-dark border-brand-dark text-white shadow-xl scale-105" 
                  : "bg-brand-light/30 border-brand-light/50 text-brand-teal hover:border-brand-teal/30"
              )}
            >
              {getIcon(goal.icon, Target)}
              {goal.title}
            </button>
          ))}
        </div>
      </div>

      {/* Amount and Note */}
      <div className="space-y-5">
        <div className="relative group">
          <div className="absolute -top-2 left-6 px-2 bg-white text-[10px] font-black text-brand-gray/60 uppercase tracking-widest z-10 transition-colors group-focus-within:text-brand-teal">Amount (₹)</div>
          <input 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-brand-bg/50 border-2 border-brand-gray/5 rounded-[28px] p-8 text-4xl font-black focus:ring-4 focus:ring-brand-light/30 focus:border-brand-teal outline-none transition-all placeholder:text-brand-gray/20 text-brand-text"
            placeholder="0"
          />
        </div>

        <div className="relative">
          <input 
            type="text" 
            value={note} 
            onChange={e => setNote(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="What's this for?"
          />
        </div>
      </div>

      {/* QR Mock / Verified info */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-px bg-gray-100 flex-1" />
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Scan or Pay</span>
          <div className="h-px bg-gray-100 flex-1" />
        </div>

        <div className="bg-brand-light/20 border border-brand-light p-5 rounded-[28px] flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-brand-dark">
            <QrCode size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-brand-teal font-black uppercase tracking-widest mb-0.5">Recipient Verified</p>
            <p className="text-sm font-black text-brand-text">rahul.sharma@okaxis</p>
          </div>
          <Check className="text-emerald-500" size={20} strokeWidth={3} />
        </div>
      </div>

      {/* Warnings */}
      {selectedCat && (
        <div className="bg-orange-50 border border-orange-100 p-5 rounded-[28px]">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-700 uppercase tracking-widest mb-3">
             {selectedCat.name} after payment
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-black text-orange-900 leading-none">₹ {(selectedCat.monthlyLimit - spentAfter).toLocaleString()}</span>
            <span className="text-[10px] text-orange-600 font-bold uppercase">left</span>
          </div>
          <div className="w-full bg-orange-200/30 h-2 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: `${(selectedCat.spent / selectedCat.monthlyLimit) * 100}%` }}
               animate={{ width: `${Math.min(percentAfter, 100)}%` }}
               className="h-full bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"
             />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-[10px] text-orange-700 font-black uppercase tracking-tight">{percentAfter.toFixed(0)}% budget used</p>
            <p className="text-[10px] text-orange-400 font-black uppercase">Limit: ₹{selectedCat.monthlyLimit.toLocaleString()}</p>
          </div>
        </div>
      )}

      {selectedGoal && (
        <div className="bg-brand-light/20 border border-brand-light p-5 rounded-[28px]">
           <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-teal uppercase tracking-widest mb-3">
             Savings Progress: {selectedGoal.title}
           </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-black text-brand-text leading-none">₹ {(selectedGoal.currentAmount + Number(amount)).toLocaleString()}</span>
            <span className="text-[10px] text-brand-teal font-bold uppercase">saved</span>
          </div>
          <div className="w-full bg-brand-light h-2 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: `${(selectedGoal.currentAmount / selectedGoal.targetAmount) * 100}%` }}
               animate={{ width: `${Math.min(((selectedGoal.currentAmount + Number(amount)) / selectedGoal.targetAmount) * 100, 100)}%` }}
               className="h-full bg-brand-teal rounded-full shadow-[0_0_8px_rgba(0,168,132,0.4)]"
             />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-[10px] text-brand-dark font-black uppercase tracking-tight">
              {(((selectedGoal.currentAmount + Number(amount)) / selectedGoal.targetAmount) * 100).toFixed(0)}% to target
            </p>
            <p className="text-[10px] text-brand-gray/60 font-black uppercase tracking-tight">Target: ₹{selectedGoal.targetAmount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Pay Buttons */}
      <div className="space-y-4 pt-4">
        <button 
          onClick={handlePay}
          disabled={isProcessing || !amount || Number(amount) <= 0}
          className="w-full bg-brand-teal hover:bg-brand-dark active:scale-95 disabled:opacity-30 disabled:grayscale transition-all text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-brand-teal/20 border-b-8 border-brand-dark"
        >
          {isProcessing ? (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full"
            />
          ) : (
            <>
              <ExternalLink size={20} strokeWidth={3} />
              Pay ₹{amount || '0'} Now
            </>
          )}
        </button>
        <p className="text-[10px] text-gray-400 text-center font-black uppercase tracking-[0.2em]">Secured by UPI Protocol</p>
      </div>
    </div>
  );
}
