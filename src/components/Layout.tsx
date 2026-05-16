import React from 'react';
import { Home, QrCode, Target, Clock, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export type View = 'home' | 'pay' | 'goals' | 'history' | 'profile' | 'categories' | 'edit-tx';

interface LayoutProps {
  currentView: View;
  onViewChange: (view: View) => void;
  children: React.ReactNode;
}

export function Layout({ currentView, onViewChange, children }: LayoutProps) {
  const navItems = [
    { id: 'home' as View, label: 'Home', icon: Home },
    { id: 'goals' as View, label: 'Goals', icon: Target },
    { id: 'history' as View, label: 'History', icon: Clock },
  ];

  const hideNav = ['pay', 'edit-tx', 'categories'].includes(currentView);

  return (
    <div className="min-h-screen bg-brand-bg flex justify-center items-center p-0 md:p-8">
      {/* Mobile Frame Simulation on Desktop */}
      <div className="w-full max-w-[400px] h-full min-h-screen md:min-h-[850px] bg-white md:rounded-[40px] md:shadow-2xl overflow-hidden relative flex flex-col border border-brand-gray/10">
        
        {/* Status Bar */}
        <div className="px-6 pt-10 pb-2 flex justify-between items-center text-xs font-semibold text-gray-500">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="opacity-70">⚡</span>
            <span>84%</span>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* Fixed Payment Bubble */}
          {!hideNav && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onViewChange('pay')}
              className="fixed bottom-28 right-8 md:absolute md:bottom-28 md:right-8 w-14 h-14 bg-brand-teal text-white rounded-full shadow-2xl flex items-center justify-center z-50 border-4 border-white group"
            >
              <div className="absolute -top-12 right-0 bg-brand-text text-white text-[10px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                SCAN & PAY
                <div className="absolute -bottom-1 right-4 w-2 h-2 bg-brand-text rotate-45" />
              </div>
              <QrCode size={24} strokeWidth={3} />
            </motion.button>
          )}
        </main>

        {/* Bottom Navigation */}
        {!hideNav && (
          <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-brand-gray/5 flex items-center justify-around pb-8 pt-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-200",
                  currentView === item.id ? "text-brand-teal scale-110" : "text-brand-gray/60 hover:text-brand-teal"
                )}
              >
                <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
