import React from 'react';
import { Search, Plus, CreditCard, ArrowRight, Wallet, TrendingUp } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { getIconById } from '../lib/icons';

export function HomeView({ onScanPay, onProfileClick }: { onScanPay: () => void, onProfileClick: () => void }) {
  const { profile, categories, transactions, goals } = useBudget();
  const { user } = useAuth();

  const totalSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);
  const totalBudget = profile?.monthlyBudget || 0;
  const remaining = totalBudget - totalSpent;
  const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - today.getDate() + 1);
  const safeDailyOverall = Math.max(0, Math.floor(remaining / daysRemaining));

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="px-5 space-y-6 pb-6">
      {/* Header */}
      <header className="flex justify-between items-center py-4">
        <div>
          <p className="text-gray-500 text-sm">{getGreeting()},</p>
          <h1 className="text-xl font-bold text-gray-900">{profile?.displayName || user?.displayName?.split(' ')[0] || 'Member'}</h1>
        </div>
        <button 
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-dark font-bold border-2 border-white shadow-sm hover:scale-105 transition-transform"
        >
          {user?.photoURL ? (
             <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
             user?.displayName?.charAt(0) || 'U'
          )}
        </button>
      </header>

      {/* Main Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-brand-light/40 border border-brand-teal/10 rounded-[40px] p-8 shadow-xl shadow-brand-teal/10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 text-center">
          <p className="text-brand-dark/50 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Total budget remaining</p>
          <h2 className="text-4xl font-black mb-6 text-brand-dark tracking-tight">₹ {remaining.toLocaleString()}</h2>
          
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-brand-teal/20 backdrop-blur-sm shadow-sm">
              <div className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
              <span className="text-[11px] font-bold text-brand-dark">Safe to spend: <span className="text-sm">₹{safeDailyOverall.toLocaleString()}</span> / day</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-brand-teal/10">
            <div>
              <p className="text-brand-dark/40 text-[9px] uppercase tracking-wider mb-1 font-black">Budget</p>
              <p className="text-sm font-bold text-brand-dark">₹ {totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-brand-dark/40 text-[9px] uppercase tracking-wider mb-1 font-black">Spent</p>
              <p className="text-sm font-bold text-brand-teal">₹ {totalSpent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-brand-dark/40 text-[9px] uppercase tracking-wider mb-1 font-black">Days Left</p>
              <p className="text-sm font-bold text-brand-dark">{daysRemaining}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Snapshot */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-brand-gray/60 uppercase tracking-widest pl-1">Category Snapshot</h3>
          <button className="text-xs text-brand-teal font-bold flex items-center gap-1">
            Safe Daily Spend
          </button>
        </div>
        <div className="bg-white border border-gray-100 rounded-[24px] divide-y divide-gray-50 overflow-hidden shadow-sm">
          {categories.slice(0, 4).map((cat) => {
            const percent = (cat.spent / cat.monthlyLimit) * 100;
            const catRemaining = cat.monthlyLimit - cat.spent;
            const safeDaily = Math.max(0, Math.floor(catRemaining / daysRemaining));

            const CategoryIcon = getIconById(cat.icon || '');

            return (
              <div key={cat.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  <CategoryIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-black text-gray-900 truncate">{cat.name}</span>
                    <span className={cn("text-[10px] font-black uppercase tracking-tighter", percent > 90 ? "text-red-500" : "text-green-600")}>
                      ₹ {cat.spent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] text-brand-gray font-bold">
                       Safe daily: <span className="text-brand-teal">₹{safeDaily.toLocaleString()}</span>
                    </p>
                    <span className="text-[10px] text-gray-300 font-black tracking-tighter">{percent.toFixed(0)}% used</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min(percent, 100)}%` }}
                       className="h-full rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                       style={{ backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
