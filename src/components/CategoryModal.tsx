import React, { useState, useEffect } from 'react';
import { X, LayoutGrid, Palette, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { useBudget } from '../context/BudgetContext';
import { serverTimestamp } from 'firebase/firestore';
import { Category } from '../types';
import { cn } from '../lib/utils';
import { ICON_MAP } from '../lib/icons';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

const COLORS = ['#EF9F27', '#E24B4A', '#1D9E75', '#378ADD', '#9333ea', '#db2777'];

const CATEGORY_ICONS = [
  'shopping-cart', 'car', 'shopping-bag', 'coffee', 'receipt', 
  'zap', 'utensils', 'heart', 'sparkles', 'layout-grid'
];

export function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const { user } = useAuth();
  const { profile, categories } = useBudget();
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [iconId, setIconId] = useState(CATEGORY_ICONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setLimit(category.monthlyLimit.toString());
      setColor(category.color || COLORS[0]);
      setIconId(category.icon || CATEGORY_ICONS[0]);
    } else {
      setName('');
      setLimit('');
      setColor(COLORS[0]);
      setIconId(CATEGORY_ICONS[0]);
    }
  }, [category, isOpen]);

  const totalBudget = profile?.monthlyBudget || 0;
  // Calculate total allocated to OTHER categories
  const otherAllocated = categories
    .filter(c => c.id !== category?.id)
    .reduce((acc, c) => acc + c.monthlyLimit, 0);
  
  const remainingAllocated = totalBudget - otherAllocated;
  const currentLimit = Number(limit) || 0;
  const isOverBudget = currentLimit > remainingAllocated;
  const allocationPercent = totalBudget > 0 ? (currentLimit / totalBudget) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !limit || isOverBudget) return;

    setIsSubmitting(true);
    try {
      const catsPath = FirestoreService.getCategoriesPath(user.uid);
      
      if (category) {
        await FirestoreService.updateDocument(catsPath, category.id, {
          name,
          monthlyLimit: Number(limit),
          color,
          icon: iconId,
          updatedAt: serverTimestamp(),
        });
      } else {
        const id = Math.random().toString(36).substring(7);
        await FirestoreService.createDocument(catsPath, id, {
          userId: user.uid,
          name,
          monthlyLimit: Number(limit),
          spent: 0,
          icon: iconId,
          color,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-[32px] p-8 z-[101] shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-brand-text">{category ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={onClose} className="p-2 bg-brand-bg rounded-full text-brand-gray/60 hover:text-brand-teal transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest ml-1 text-xs">Category Name</label>
                <div className="relative">
                  <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray/40" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Entertainment, Health"
                    className="w-full bg-brand-bg/50 border border-brand-gray/5 rounded-2xl p-5 pl-12 text-sm font-bold focus:ring-2 focus:ring-brand-teal outline-none transition-all text-brand-text"
                    required
                  />
                </div>
              </div>

              <div id="root" className="space-y-2">
                <div className="flex justify-between items-end mb-1 px-1">
                  <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest">Monthly Budget (₹)</label>
                  <span className={cn("text-[10px] font-black", isOverBudget ? "text-rose-500" : "text-brand-teal")}>
                    {allocationPercent.toFixed(1)}% of total budget
                  </span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                    placeholder="5000"
                    className={cn(
                       "w-full bg-brand-bg/50 border rounded-[20px] p-5 text-lg font-black focus:ring-4 outline-none transition-all shadow-inner",
                       isOverBudget ? "border-rose-200 focus:ring-rose-100 text-rose-600" : "border-brand-gray/5 focus:ring-brand-light/30 text-brand-text"
                    )}
                    required
                  />
                  {isOverBudget && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-red-500 pointer-events-none"
                    >
                      <AlertCircle size={16} />
                      <span className="text-[10px] font-bold uppercase">Exceeds Limit</span>
                    </motion.div>
                  )}
                </div>
                <div className="flex justify-between px-2">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                    Available to allocate: <span className="text-gray-900">₹{remainingAllocated.toLocaleString()}</span>
                  </p>
                </div>
              </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest ml-1">Choose Icon</label>
                <div className="grid grid-cols-5 gap-3 bg-brand-bg/50 p-3 rounded-[24px] border border-brand-gray/5">
                  {CATEGORY_ICONS.map((id) => {
                    const Icon = ICON_MAP[id] || LayoutGrid;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setIconId(id)}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          iconId === id 
                            ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/20 scale-110" 
                            : "text-brand-gray/40 hover:text-brand-teal hover:bg-brand-light"
                        )}
                      >
                        <Icon size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Palette size={12} /> Brand Color
                  </label>
                  <div className="flex justify-between bg-brand-bg/50 p-2 rounded-2xl border border-brand-gray/5">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-10 h-10 rounded-full transition-all relative overflow-hidden",
                          color === c ? 'scale-110 shadow-lg ring-2 ring-white ring-offset-2 ring-offset-brand-teal' : 'hover:scale-105 saturate-50 hover:saturate-100'
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && (
                          <motion.div 
                            layoutId="selected-color"
                            className="absolute inset-0 bg-white/20 flex items-center justify-center"
                          >
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || isOverBudget || !name || !limit}
                className={cn(
                  "w-full py-5 rounded-[24px] font-black shadow-xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale",
                  isOverBudget ? "bg-brand-bg text-brand-gray/30" : "bg-brand-teal hover:bg-brand-dark text-white shadow-brand-teal/20"
                )}
              >
                {category ? 'Save Changes' : 'Create Category'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
