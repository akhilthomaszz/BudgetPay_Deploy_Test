import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BudgetProvider, useBudget } from './src/context/BudgetContext';
import { Layout } from './src/components/Layout';
import { HomeView } from './src/components/HomeView';
import { PayView } from './src/components/PayView';
import { GoalsView } from './src/components/GoalsView';
import { HistoryView } from './src/components/HistoryView';
import { ProfileView } from './src/components/ProfileView';
import { CategoriesView } from './src/components/CategoriesView';
import { EditTxView } from './src/components/EditTxView';
import { LandingPage } from './src/components/LandingPage';
import { Loader2 } from 'lucide-react-native';

// Note: If you moved App.tsx to the root, ensure your imports point to ./src/...
type ViewType = 'home' | 'pay' | 'goals' | 'history' | 'profile' | 'categories' | 'edit-tx';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { loading: budgetLoading } = useBudget();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  const handleEditTx = (id: string) => {
    setEditingTxId(id);
    setCurrentView('edit-tx');
  };

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onScanPay={() => setCurrentView('pay')} onProfileClick={() => setCurrentView('profile')} />;
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
        return <HomeView onScanPay={() => setCurrentView('pay')} onProfileClick={() => setCurrentView('profile')} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={(v: any) => setCurrentView(v)}>
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

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a', // matches your bg-blue-900
  },
});
