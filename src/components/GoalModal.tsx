import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { serverTimestamp } from 'firebase/firestore';
import { Goal } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { ICON_MAP } from '../lib/icons';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
}

const COLORS = ['#1D9E75', '#378ADD', '#EF9F27', '#E24B4A', '#9333ea', '#db2777'];

const GOAL_ICONS = [
  'target', 'home', 'car', 'plane', 'bike', 'gamepad', 'trophy', 
  'gift', 'laptop', 'smartphone', 'gem', 'sofa', 'construction'
];

export function GoalModal({ isOpen, onClose, goal }: GoalModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'completed'>('active');
  const [iconId, setIconId] = useState(GOAL_ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTarget(goal.targetAmount.toString());
      setMonthlyContribution(goal.monthlyContribution?.toString() || '');
      setStatus(goal.status || 'active');
      setIconId(goal.icon || GOAL_ICONS[0]);
      setColor(goal.color || COLORS[0]);
      // deadline is stored as ISO string in context
      try {
        setDeadline(format(new Date(goal.deadline), 'yyyy-MM-dd'));
      } catch (e) {
        setDeadline('');
      }
    } else {
      setTitle('');
      setTarget('');
      setMonthlyContribution('');
      setDeadline('');
      setStatus('active');
      setIconId(GOAL_ICONS[0]);
      setColor(COLORS[0]);
    }
  }, [goal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !target || !deadline) return;

    setIsSubmitting(true);
    try {
      const goalsPath = FirestoreService.getGoalsPath(user.uid);
      
      if (goal) {
        await FirestoreService.updateDocument(goalsPath, goal.id, {
          title,
          targetAmount: Number(target),
          monthlyContribution: monthlyContribution ? Number(monthlyContribution) : 0,
          deadline: new Date(deadline),
          status,
          icon: iconId,
          color,
          updatedAt: serverTimestamp(),
        });
      } else {
        const id = Math.random().toString(36).substring(7);
        await FirestoreService.createDocument(goalsPath, id, {
          userId: user.uid,
          title,
          targetAmount: Number(target),
          currentAmount: 0,
          monthlyContribution: monthlyContribution ? Number(monthlyContribution) : 0,
          deadline: new Date(deadline),
          status,
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
              <h2 className="text-xl font-black text-brand-text">{goal ? 'Edit Savings Goal' : 'New Savings Goal'}</h2>
              <button onClick={onClose} className="p-2 bg-brand-bg rounded-full text-brand-gray/60 hover:text-brand-teal transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest ml-1">Goal Name</label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray/40" size={18} />
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Dream Car, Emergency Fund"
                    className="w-full bg-brand-bg/50 border border-brand-gray/5 rounded-2xl p-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-brand-teal outline-none text-brand-text"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest ml-1">Target (₹)</label>
                  <input 
                    type="number" 
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-brand-bg/50 border border-brand-gray/5 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-brand-teal outline-none text-brand-text"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest ml-1">Daily/Monthly (₹)</label>
                  <input 
                    type="number" 
                    value={monthlyContribution}
                    onChange={e => setMonthlyContribution(e.target.value)}
                    placeholder="2000"
                    className="w-full bg-brand-bg/50 border border-brand-gray/5 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-brand-teal outline-none text-brand-text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest ml-1">Deadline Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray/40" size={16} />
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-brand-bg/50 border border-brand-gray/5 rounded-2xl p-4 pl-10 text-[11px] font-bold focus:ring-2 focus:ring-brand-teal outline-none text-brand-text"
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest ml-1">Choose Icon</label>
                  <div className="grid grid-cols-5 gap-3 bg-brand-bg/50 p-3 rounded-[24px] border border-brand-gray/5 overflow-x-auto no-scrollbar">
                    {GOAL_ICONS.map((id) => {
                      const Icon = ICON_MAP[id] || Target;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setIconId(id)}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
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
                    <Palette size={12} /> Goal Color
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
                            layoutId="selected-color-goal"
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-gray/60 uppercase tracking-widest ml-1">Goal Status</label>
                <div className="flex gap-2">
                  {(['active', 'inactive'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        status === s 
                          ? "bg-brand-teal border-brand-teal text-white shadow-lg shadow-brand-teal/20" 
                          : "bg-brand-bg border-brand-gray/5 text-brand-gray/40"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                  {status === 'completed' && (
                    <div className="flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                      Completed
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-teal hover:bg-brand-dark text-white py-5 rounded-[24px] font-black shadow-xl shadow-brand-teal/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {goal ? 'Update Goal' : 'Create Goal'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
