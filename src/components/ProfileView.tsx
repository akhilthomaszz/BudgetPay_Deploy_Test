import React from 'react';
import { User, Settings, LayoutGrid, CalendarRange, Bell, FileText, LogOut, ChevronRight, ArrowLeft } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

import { ProfileSettingsModal } from './ProfileSettingsModal';

export function ProfileView({ onBack, onCategories }: { onBack: () => void, onCategories: () => void }) {
  const { profile, categories, transactions } = useBudget();
  const { user, logOut } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const totalSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);

  const menuItems = [
    { label: 'Budget Settings', sub: 'Adjust limits & currency', icon: Settings, color: 'text-brand-teal bg-brand-light', onClick: () => setIsSettingsOpen(true) },
    { label: 'Budget Categories', sub: 'Manage & edit spending limits', icon: LayoutGrid, color: 'text-brand-dark bg-emerald-50', onClick: onCategories },
    { label: 'Monthly Reset', sub: 'Resets on 1st of every month', icon: CalendarRange, color: 'text-orange-600 bg-orange-100' },
    { label: 'Export Data', sub: 'Download as CSV or PDF', icon: FileText, color: 'text-purple-600 bg-purple-100', onClick: () => alert('Exporting data... Feature coming soon!') },
  ];

  return (
    <div className="space-y-6 pb-6 pt-2">
      {/* Header */}
      <div className="px-5 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-brand-gray/60">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-brand-text">Profile</h2>
        <div className="w-10" />
      </div>

      <ProfileSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* User Info */}
      <div className="px-5 flex items-center gap-4 py-2">
        <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-brand-dark text-xl font-bold border-4 border-white shadow-md">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            user?.displayName?.charAt(0) || <User size={24} />
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-brand-text leading-tight">{profile?.displayName || user?.displayName || 'User'}</h3>
          <p className="text-sm text-brand-gray/80">{user?.email}</p>
          <p className="text-[10px] text-brand-teal font-black mt-1 uppercase tracking-wider">Member since Jan 2025</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-5 grid grid-cols-2 gap-3">
        <div className="bg-brand-bg/50 border border-brand-gray/5 p-4 rounded-2xl text-center">
          <p className="text-lg font-bold text-brand-text">₹ {totalSpent.toLocaleString()}</p>
          <p className="text-[10px] text-brand-gray/60 font-bold uppercase tracking-tight">Spent this month</p>
        </div>
        <div className="bg-brand-bg/50 border border-brand-gray/5 p-4 rounded-2xl text-center">
          <p className="text-lg font-bold text-brand-teal">{transactions.length}</p>
          <p className="text-[10px] text-brand-gray/60 font-bold uppercase tracking-tight">Payments made</p>
        </div>
      </div>

      {/* Menu */}
      <div className="border-t border-brand-gray/5 divide-y divide-brand-gray/5">
        {menuItems.map((item, idx) => (
          <button 
            key={idx}
            onClick={item.onClick}
            className="w-full px-5 py-5 flex items-center gap-4 hover:bg-brand-bg/20 transition-all active:scale-[0.98]"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.color)}>
              <item.icon size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-brand-text leading-tight">{item.label}</p>
              <p className="text-[11px] text-brand-gray/40 font-medium">{item.sub}</p>
            </div>
            <ChevronRight size={16} className="text-brand-gray/20" />
          </button>
        ))}
        
        <button 
          onClick={logOut}
          className="w-full px-5 py-5 flex items-center gap-4 hover:bg-rose-50 transition-all active:scale-[0.98] group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <LogOut size={20} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-rose-500 leading-tight">Sign out</p>
            <p className="text-[11px] text-rose-300 font-medium group-hover:text-rose-400 transition-colors">Log out of this account</p>
          </div>
          <ChevronRight size={16} className="text-rose-100 group-hover:text-rose-300 transition-colors" />
        </button>
      </div>
    </div>
  );
}
