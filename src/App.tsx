import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { Layout, ViewType } from './components/Layout';
import { HomeView } from './components/HomeView';
import { PayView } from './components/PayView';
import { GoalsView } from './components/GoalsView';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { CategoriesView } from './components/CategoriesView';
import { EditTxView } from './components/EditTxView';
import { LandingPage } from './components/LandingPage';

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
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!user) {
    return <LandingPage onStart={() => {}} />; // Landing page will need conversion too
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
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <BudgetProvider>
          <AppContent />
        </BudgetProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    backgroundColor: '#1e3a8a', // blue-900 equivalent
    justifyContent: 'center',
    alignItems: 'center',
  }
});
