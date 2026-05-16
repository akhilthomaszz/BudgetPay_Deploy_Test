import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingPage() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[80%] aspect-square bg-blue-800 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] aspect-square bg-green-900 rounded-full blur-[100px] opacity-30" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center text-center space-y-8 max-w-sm"
      >
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl rotate-12">
          <Wallet size={40} className="text-blue-900 -rotate-12" />
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tight leading-tight italic">
            Budget<span className="text-green-400">Pay.</span>
          </h1>
          <p className="text-blue-100 text-lg font-medium opacity-80 px-4">
            Spend smarter. Save faster. <br />The modern way to manage your UPI life.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full pt-4">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
               <ShieldCheck size={18} />
            </div>
            <p className="text-xs font-bold text-left opacity-90">Bank-grade security over your Firestore data.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
               <Zap size={18} />
            </div>
            <p className="text-xs font-bold text-left opacity-90">Real-time budget tracking on every scan.</p>
          </div>
        </div>

        <button 
          onClick={signIn}
          className="w-full bg-white text-blue-900 hover:bg-blue-50 active:scale-95 transition-all py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-blue-950/50"
        >
          Sign in with Google
          <ArrowRight size={20} />
        </button>
      </motion.div>
    </div>
  );
}
