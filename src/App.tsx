/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { Layout, View } from './components/Layout';
import { HomeView } from './components/HomeView';
import { PayView } from './components/PayView';
import { GoalsView } from './components/GoalsView';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { CategoriesView } from './components/CategoriesView';
import { EditTxView } from './components/EditTxView';
import { LandingPage } from './components/LandingPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { loading: budgetLoading } = useBudget();
  const [currentView, setCurrentView] = useState<View>('home');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  const handleEditTx = (id: string) => {
    setEditingTxId(id);
    setCurrentView('edit-tx');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-900">
        <Loader2 className="w-8 h-8 text-white animate-spin opacity-50" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeView 
            onScanPay={() => setCurrentView('pay')} 
            onProfileClick={() => setCurrentView('profile')} 
          />
        );
      case 'pay':
        return <PayView onBack={() => setCurrentView('home')} onComplete={() => setCurrentView('history')} />;
      case 'goals':
        return <GoalsView />;
      case 'history':
        return <HistoryView onEdit={handleEditTx} />;
      case 'profile':
        return <ProfileView onBack={() => setCurrentView('home')} onCategories={() => setCurrentView('categories')} />;
      case 'categories':
        return <CategoriesView onBack={() => setCurrentView('profile')} />;
      case 'edit-tx':
        return <EditTxView transactionId={editingTxId} onBack={() => setCurrentView('history')} />;
      default:
        return (
          <HomeView 
            onScanPay={() => setCurrentView('pay')} 
            onProfileClick={() => setCurrentView('profile')} 
          />
        );
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <AppContent />
      </BudgetProvider>
    </AuthProvider>
  );
}
