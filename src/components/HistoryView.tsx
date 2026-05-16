import React from 'react';
import { Clock, Filter, Edit2, Trash2, LayoutGrid } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { getIconById } from '../lib/icons';

import { Transaction } from '../types';

export function HistoryView({ onEdit }: { onEdit: (id: string) => void }) {
  const { transactions, categories } = useBudget();
  const { user } = useAuth();

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this transaction?')) return;
    try {
      await FirestoreService.deleteDocument(FirestoreService.getTransactionsPath(user.uid), id);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (catName: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    const Icon = getIconById(cat?.icon || '', LayoutGrid);
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

  // Group by date
  const grouped = transactions.reduce((acc, tx) => {
    const date = parseISO(tx.date);
    let title = format(date, 'd MMMM');
    if (isToday(date)) title = 'Today';
    else if (isYesterday(date)) title = 'Yesterday';
    
    if (!acc[title]) acc[title] = [];
    acc[title].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="px-5 space-y-6 pb-6 pt-2">
      <header className="flex justify-between items-center py-4 sticky top-0 bg-white/90 backdrop-blur-md z-10 -mx-5 px-5 border-b border-brand-gray/5">
        <h1 className="text-xl font-bold text-brand-text">History</h1>
        <button className="px-3 py-1.5 rounded-full bg-brand-bg border border-brand-gray/10 text-[10px] font-bold text-brand-gray flex items-center gap-1.5 hover:bg-brand-teal hover:text-white transition-all">
          <Filter size={12} /> Filter
        </button>
      </header>

      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date} className="space-y-3">
          <h3 className="text-[10px] font-bold text-brand-gray/60 uppercase tracking-widest pl-1">{date}</h3>
          <div className="bg-white border border-brand-gray/10 rounded-3xl divide-y divide-brand-gray/5 overflow-hidden shadow-sm">
            {(txs as Transaction[]).map((tx) => (
              <motion.div 
                key={tx.id}
                className="p-4 flex items-center gap-4 hover:bg-brand-bg/50 transition-colors group"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", getCatColor(tx.categoryName))}>
                  {getIcon(tx.categoryName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-sm font-bold text-brand-text truncate pr-2">{tx.receiverName || 'Payment'}</span>
                    <span className="text-sm font-black text-rose-500 shrink-0">₹ {tx.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-brand-gray font-medium truncate pr-2">{tx.note || 'No note added'}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => onEdit(tx.id)}
                         className="p-1 text-brand-gray/30 hover:text-brand-teal"
                       >
                         <Edit2 size={12} />
                       </button>
                       <button 
                         onClick={() => handleDelete(tx.id)}
                         className="p-1 text-brand-gray/30 hover:text-rose-500"
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[9px] text-brand-gray/40 font-bold uppercase tracking-tighter">
                      via {tx.method || 'UPI'} · {format(parseISO(tx.date), 'h:mm a')}
                    </p>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", getCatColor(tx.categoryName))}>
                      {tx.categoryName}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {transactions.length === 0 && (
         <div className="text-center py-20 text-gray-400 space-y-2">
            <Clock size={40} className="mx-auto opacity-20" />
            <p className="text-sm font-medium">No transactions yet</p>
         </div>
      )}
    </div>
  );
}
