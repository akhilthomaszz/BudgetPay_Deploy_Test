import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Target, Plus, Edit2, 
  CheckCircle2, Trophy, AlertCircle, ChevronRight, Lightbulb
} from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Goal } from '../types';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { serverTimestamp } from 'firebase/firestore';
import { getIconById } from '../lib/icons';

import { GoalModal } from './GoalModal';

export function GoalsView() {
  const { goals } = useBudget();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);

  const activeGoals = goals.filter(g => !g.status || g.status === 'active');
  const inactiveGoals = goals.filter(g => g.status === 'inactive');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const totalSaved = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const totalMonthlySave = activeGoals.reduce((acc, goal) => acc + (goal.monthlyContribution || 0), 0);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (goal: Goal, status: 'active' | 'inactive' | 'completed') => {
    if (!user) return;
    try {
      const goalsPath = FirestoreService.getGoalsPath(user.uid);
      await FirestoreService.updateDocument(goalsPath, goal.id, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async (goal: Goal) => {
    handleUpdateStatus(goal, 'completed');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const getIcon = (iconName: string, color?: string) => {
    const Icon = getIconById(iconName || '', Target);
    return <Icon size={18} style={color ? { color } : {}} />;
  };

  return (
    <div className="px-5 space-y-6 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center py-6">
        <div>
          <h1 className="text-2xl font-black text-brand-text tracking-tight">Savings Goals</h1>
          <p className="text-brand-gray/60 text-[10px] font-black uppercase tracking-widest mt-1">
            {activeGoals.length} Active · {completedGoals.length} Achieved
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 rounded-2xl bg-brand-teal text-white flex items-center justify-center shadow-xl shadow-brand-teal/20 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Goal Modal */}
      <GoalModal isOpen={isModalOpen} onClose={handleCloseModal} goal={editingGoal} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-brand-bg/40 border border-brand-gray/10 p-5 rounded-[24px]">
          <p className="text-brand-gray/60 text-[9px] font-black uppercase tracking-[0.1em] mb-1">Total Saved</p>
          <p className="text-xl font-black text-brand-text">₹ {totalSaved.toLocaleString()}</p>
        </div>
        <div className="bg-brand-teal border border-brand-dark/20 p-5 rounded-[24px] shadow-lg shadow-brand-teal/10 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
          <p className="text-white/70 text-[9px] font-black uppercase tracking-[0.1em] mb-1 relative z-10">Target Savings/mo</p>
          <p className="text-xl font-black text-white relative z-10">₹ {totalMonthlySave.toLocaleString()}</p>
        </div>
      </div>

      {/* Achievements Toggle */}
      {completedGoals.length > 0 && (
        <button 
          onClick={() => setShowAchievements(!showAchievements)}
          className="w-full flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-2xl group"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <Trophy size={16} />
             </div>
             <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">View Achievements ({completedGoals.length})</span>
          </div>
          <ChevronRight size={16} className={cn("text-amber-400 transition-transform", showAchievements && "rotate-90")} />
        </button>
      )}

      {/* Achievements List */}
      <AnimatePresence>
        {showAchievements && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            {completedGoals.map(goal => (
              <div key={goal.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm grayscale opacity-60">
                 <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <CheckCircle2 size={18} />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-xs font-bold text-gray-900 line-through">{goal.title}</h4>
                    <p className="text-[9px] font-black text-green-600 uppercase tracking-tight">₹{goal.targetAmount.toLocaleString()} Saved Successfully!</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(goal, 'active')}
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                      title="Reactivate Goal"
                    >
                      <Plus size={14} />
                    </button>
                    <div className="text-amber-500">
                       <Trophy size={14} />
                    </div>
                 </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Goals List */}
      <div className="space-y-4">
        {activeGoals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const isTargetMet = goal.currentAmount >= goal.targetAmount;

          return (
            <motion.div 
              key={goal.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 p-5 rounded-[32px] shadow-sm space-y-5 relative transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: `${goal.color}10` }}
                  >
                    {getIcon(goal.icon, goal.color)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight">{goal.title}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Target: {format(parseISO(goal.deadline), 'MMM yyyy')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5",
                    isTargetMet ? "bg-emerald-100 text-emerald-700" : "bg-brand-light text-brand-dark"
                  )}>
                    {isTargetMet ? <CheckCircle2 size={12} /> : null}
                    {progress.toFixed(0)}%
                  </div>
                  <button 
                    onClick={() => handleEdit(goal)}
                    className="p-2 bg-brand-bg text-brand-gray/60 hover:text-brand-teal rounded-xl transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <div className="flex flex-col">
                      <span className="text-lg font-black text-gray-900 leading-none">₹ {goal.currentAmount.toLocaleString()}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Accumulated</span>
                   </div>
                   <div className="text-right">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Goal: ₹ {goal.targetAmount.toLocaleString()}</span>
                   </div>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      backgroundColor: goal.color,
                      boxShadow: `0 0 12px ${goal.color}30`
                    }}
                  />
                </div>
              </div>

              {isTargetMet ? (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => handleComplete(goal)}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                >
                  <Trophy size={14} /> Mark as Complete
                </motion.button>
              ) : (
                <div className="flex items-center justify-between">
                  {goal.monthlyContribution && goal.monthlyContribution > 0 ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-brand-bg rounded-xl">
                      <div className="w-1 h-1 bg-brand-teal rounded-full animate-pulse" />
                      <p className="text-[9px] text-brand-gray font-extrabold uppercase tracking-tight">
                        ₹{goal.monthlyContribution.toLocaleString()} Planned / Month
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-xl">
                      <AlertCircle size={10} className="text-orange-400" />
                      <p className="text-[9px] text-orange-400 font-extrabold uppercase tracking-tight">No plan set</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">₹ {(goal.targetAmount - goal.currentAmount).toLocaleString()} Left</p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        
        {activeGoals.length === 0 && inactiveGoals.length === 0 && (
           <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
              <Target size={48} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">No Savings Goals</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1">Start planning your future today</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-6 px-6 py-2 bg-white border border-gray-100 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm"
              >
                Create Goal
              </button>
           </div>
        )}
      </div>

      {/* Inactive Goals Section */}
      {inactiveGoals.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 px-1">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paused Goals</h2>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {inactiveGoals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <motion.div 
                  key={goal.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-50/50 border border-gray-100 p-4 rounded-[24px] opacity-70 hover:opacity-100 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 grayscale">
                        {getIcon(goal.icon)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-500">{goal.title}</h4>
                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-tight mt-0.5">Paused · {progress.toFixed(0)}% Done</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEdit(goal)}
                      className="p-2 bg-white border border-gray-100 text-gray-400 hover:text-blue-600 rounded-xl transition-colors shadow-sm"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="bg-brand-text text-white p-6 rounded-[32px] overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 transform translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full" />
        <div className="flex gap-4 relative z-10">
          <div className="w-10 h-10 bg-brand-teal rounded-xl flex items-center justify-center shrink-0">
             <Lightbulb size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight mb-1">Savings Insight</p>
            <p className="text-[11px] text-brand-gray leading-relaxed font-medium">
              Based on your recent spending, you could save an additional <span className="text-white font-bold">₹850</span> this month by reducing 'Dining Out'.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
