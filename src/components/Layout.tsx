import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, QrCode, Target, Clock, User } from 'lucide-react-native';

export type ViewType = 'home' | 'pay' | 'goals' | 'history' | 'profile' | 'categories' | 'edit-tx';

interface LayoutProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  children: React.ReactNode;
}

const { width } = Dimensions.get('window');

export function Layout({ currentView, onViewChange, children }: LayoutProps) {
  const navItems = [
    { id: 'home' as ViewType, label: 'Home', icon: Home },
    { id: 'goals' as ViewType, label: 'Goals', icon: Target },
    { id: 'history' as ViewType, label: 'History', icon: Clock },
  ];

  const hideNav = ['pay', 'edit-tx', 'categories'].includes(currentView);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={styles.content}>
        <ScrollView 
          contentContainerStyle={[styles.scrollView, hideNav && styles.scrollViewNoNav]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {!hideNav && (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => onViewChange('pay')}
            style={styles.payButton}
          >
            <QrCode color="#fff" size={28} strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      {!hideNav && (
        <View style={styles.bottomNav}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onViewChange(item.id)}
              style={styles.navItem}
              activeOpacity={0.6}
            >
              <item.icon 
                color={currentView === item.id ? '#00A884' : '#667781'} 
                size={22} 
                strokeWidth={currentView === item.id ? 2.5 : 2} 
              />
              <Text style={[
                styles.navText,
                currentView === item.id && styles.navTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 100, // Space for nav
  },
  scrollViewNoNav: {
    paddingBottom: 20,
  },
  payButton: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    width: 64,
    height: 64,
    backgroundColor: '#00A884',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: '#fff',
    zIndex: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 25,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'space-around',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#00A884',
  }
});
