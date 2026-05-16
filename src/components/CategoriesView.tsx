import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Edit2, Trash2, AlertCircle, Target, LayoutGrid
} from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { CategoryModal } from './CategoryModal';
import { GoalModal } from './GoalModal';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { getIconById } from '../lib/icons';

import { Category, Goal } from '../types';

export function CategoriesView({ onBack }: { onBack: () => void }) {
  const { categories, profile, goals } = useBudget();
  const { user } = useAuth();
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const getCategoryIcon = (cat: Category) => {
    const Icon = getIconById(cat.icon || '', LayoutGrid);
    return <Icon size={18} />;
  };

  const getGoalIcon = (goal: Goal) => {
    const Icon = getIconById(goal.icon || '', Target);
    return <Icon size={18} />;
  };

  const getCatColor = (catName: string) => {
    switch (catName.toLowerCase()) {
      case 'groceries': return 'text-orange-600 bg-orange-100';
      case 'transport': return 'text-brand-teal bg-brand-light';
      case 'shopping': return 'text-red-600 bg-red-100';
      case 'dining': return 'text-green-600 bg-green-100';
      case 'bills': return 'text-purple-600 bg-purple-100';
      default: return 'text-brand-gray bg-brand-bg';
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this category?')) return;
    try {
      await FirestoreService.deleteDocument(FirestoreService.getCategoriesPath(user.uid), id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCat = (cat: Category) => {
    setEditingCategory(cat);
    setIsCatModalOpen(true);
  };

  const handleCloseCatModal = () => {
    setIsCatModalOpen(false);
    setEditingCategory(null);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleCloseGoalModal = () => {
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  const activeGoalsForList = goals.filter(g => g.status !== 'completed');

  const totalCatAllocated = categories.reduce((acc, cat) => acc + cat.monthlyLimit, 0);
  const totalGoalAllocated = activeGoalsForList.reduce((acc, goal) => acc + (goal.monthlyContribution || 0), 0);
  const totalAllocated = totalCatAllocated + totalGoalAllocated;

  const totalCatSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);
  // For goals, we might want to track current month's contribution, 
  // but for now let's just use 0 or something similar if we don't have per-month spent for goals.
  // Actually, let's just use the categories' spent for the 'Total Usage' progress bar to keep it simple,
  // OR if we want to be accurate, we'd need a way to track this month's goal payments.
  const totalSpent = totalCatSpent; 
  const totalBudget = profile?.monthlyBudget || 0;
  const allocationPercent = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
  const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="px-5 space-y-6 pb-6 pt-2">
      <header className="flex items-center justify-between py-4">
        <button onClick={onBack} className="p-2 -ml-2 text-brand-gray">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-brand-text">Budget Categories</h2>
        <button 
          onClick={() => setIsCatModalOpen(true)}
          className="w-8 h-8 rounded-full bg-brand-bg border border-brand-gray/10 flex items-center justify-center text-brand-gray transition-colors"
        >
          <Plus size={16} />
        </button>
      </header>

      <CategoryModal 
        isOpen={isCatModalOpen} 
        onClose={handleCloseCatModal} 
        category={editingCategory}
      />

      <GoalModal 
        isOpen={isGoalModalOpen}
        onClose={handleCloseGoalModal}
        goal={editingGoal}
      />

      <div className="space-y-6">
        <div className="bg-white rounded-[32px] p-6 border border-brand-gray/10 space-y-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[10px] font-black text-brand-gray/60 uppercase tracking-[0.1em] mb-2">
                {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()} Allocation
              </h3>
              <div className="flex items-baseline gap-1.5 focus-within:ring-2">
                <span className="text-2xl font-black text-brand-text tracking-tight">₹{totalAllocated.toLocaleString()}</span>
                <span className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest">/ ₹{totalBudget.toLocaleString()}</span>
              </div>
            </div>
            <div className={cn(
              "px-3 py-1.5 rounded-xl flex flex-col items-center justify-center font-black",
              allocationPercent > 100 ? "bg-red-50 text-red-600 border border-red-100" : "bg-brand-teal text-white shadow-lg shadow-brand-teal/20"
            )}>
              <span className="text-sm leading-none">{allocationPercent.toFixed(0)}%</span>
              <span className="text-[8px] uppercase tracking-tighter mt-1">Planned</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-brand-gray/60 uppercase tracking-widest">Spend Allocation</span>
              <p className="text-xs font-bold text-brand-text">₹{totalCatAllocated.toLocaleString()}</p>
              <div className="h-1 w-full bg-brand-gray/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${(totalCatAllocated / (totalAllocated || 1)) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-brand-gray/60 uppercase tracking-widest">Save Allocation</span>
              <p className="text-xs font-bold text-brand-teal">₹{totalGoalAllocated.toLocaleString()}</p>
              <div className="h-1 w-full bg-brand-gray/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-teal rounded-full"
                  style={{ width: `${(totalGoalAllocated / (totalAllocated || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-brand-gray/10">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black text-brand-gray/60 uppercase tracking-widest">Overall Budget Utilization</span>
              </div>
              <div className="h-2 w-full bg-brand-gray/10 rounded-full overflow-hidden flex shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalCatAllocated / (totalBudget || 1)) * 100}%` }}
                  className="h-full bg-orange-400"
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalGoalAllocated / (totalBudget || 1)) * 100}%` }}
                  className="h-full bg-brand-teal border-l border-white/20"
                />
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-[8px] font-black text-brand-gray/60 uppercase tracking-widest">Spending</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-brand-teal" />
                    <span className="text-[8px] font-black text-brand-gray/60 uppercase tracking-widest">Savings</span>
                 </div>
              </div>
            </div>
          </div>

          {allocationPercent > 100 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 text-red-500 bg-red-50/50 p-4 rounded-2xl border border-red-100/50"
            >
               <AlertCircle size={18} className="shrink-0" />
               <p className="text-[10px] font-bold uppercase tracking-tight leading-normal">
                 Warning: You have allocated <span className="font-black">₹{(totalAllocated - totalBudget).toLocaleString()}</span> more than your overall budget.
               </p>
            </motion.div>
          )}
        </div>
        
        {/* Spend Budget Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-brand-gray/50 uppercase tracking-[0.2em]">Spend Budget</h3>
            <span className="text-[9px] font-bold text-brand-gray/50 uppercase tracking-widest">₹{totalCatAllocated.toLocaleString()} Total</span>
          </div>
          <div className="bg-white border border-brand-gray/10 rounded-[24px] divide-y divide-brand-gray/5 overflow-hidden shadow-sm">
            {categories.map((cat) => {
              const percent = (cat.spent / cat.monthlyLimit) * 100;
              const remaining = cat.monthlyLimit - cat.spent;
              
              return (
                <div key={cat.id} className="p-4 flex items-center gap-4 hover:bg-brand-bg/20 transition-colors group">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", getCatColor(cat.name))}>
                     {getCategoryIcon(cat)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-bold text-brand-text truncate">{cat.name}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditCat(cat)}
                          className="p-1 text-brand-gray/30 hover:text-brand-teal transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="p-1 text-brand-gray/30 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-brand-gray font-medium leading-tight">Budget ₹{cat.monthlyLimit.toLocaleString()}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-brand-gray/80 font-bold uppercase tracking-tight">₹{remaining.toLocaleString()} left</span>
                          <span className="w-0.5 h-0.5 bg-brand-gray/20 rounded-full" />
                          <span className="text-[9px] text-brand-gray/40 font-bold uppercase tracking-tight">{(cat.monthlyLimit / (profile?.monthlyBudget || 1) * 100).toFixed(1)}% of total</span>
                        </div>
                      </div>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", getCatColor(cat.name))}>
                        {percent.toFixed(0)}% used
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                      <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(percent, 100)}%` }}
                         className="h-full rounded-full"
                         style={{ backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Budget Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-brand-gray/50 uppercase tracking-[0.2em]">Save Budget</h3>
            <span className="text-[9px] font-bold text-brand-gray/50 uppercase tracking-widest">₹{totalGoalAllocated.toLocaleString()} Total</span>
          </div>
          <div className="bg-white border border-brand-gray/10 rounded-[24px] divide-y divide-brand-gray/5 overflow-hidden shadow-sm">
            {activeGoalsForList.map((goal) => {
              const monthlyGoal = goal.monthlyContribution || 0;
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const isInactive = goal.status === 'inactive';
              
              return (
                <div key={goal.id} className={cn(
                  "p-4 flex items-center gap-4 hover:bg-brand-bg/20 transition-colors group",
                  isInactive ? "bg-brand-bg/40 opacity-60" : "bg-brand-light/10"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    isInactive ? "bg-brand-bg text-brand-gray/60" : "bg-brand-light text-brand-teal"
                  )}>
                     {getGoalIcon(goal)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-brand-text truncate">{goal.title}</span>
                         <span className={cn(
                           "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                           isInactive ? "bg-brand-bg text-brand-gray/60" : "bg-brand-teal text-white"
                         )}>
                           {isInactive ? 'Paused' : 'Goal'}
                         </span>
                      </div>
                      <button 
                        onClick={() => handleEditGoal(goal)}
                        className="p-1 text-brand-gray/30 hover:text-brand-teal transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-brand-gray font-medium leading-tight">Target Save ₹{monthlyGoal.toLocaleString()}/mo</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-tight",
                            isInactive ? "text-brand-gray/60" : "text-brand-teal"
                          )}>₹{(goal.targetAmount - goal.currentAmount).toLocaleString()} to target</span>
                          <span className="w-0.5 h-0.5 bg-brand-gray/20 rounded-full" />
                          <span className="text-[9px] text-brand-gray/40 font-bold uppercase tracking-tight">{(monthlyGoal / (profile?.monthlyBudget || 1) * 100).toFixed(1)}% of total</span>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                        isInactive ? "bg-brand-bg text-brand-gray/60" : "bg-brand-light text-brand-teal"
                      )}>
                        {progress.toFixed(0)}% safe
                      </span>
                    </div>
                    <div className="w-full bg-brand-gray/10 h-1 rounded-full overflow-hidden">
                      <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(progress, 100)}%` }}
                         className={cn("h-full rounded-full", isInactive ? "bg-brand-gray/30" : "bg-brand-teal")}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          onClick={() => setIsCatModalOpen(true)}
          className="w-full py-4 rounded-[24px] border-2 border-dashed border-brand-gray/10 text-brand-gray text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-brand-bg transition-all"
        >
          <Plus size={16} /> Add new category
        </button>
      </div>
    </div>
  );
}

