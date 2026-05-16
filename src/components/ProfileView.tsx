import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { User, Settings, LayoutGrid, CalendarRange, Bell, FileText, LogOut, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';

export function ProfileView({ onBack, onCategories }: { onBack: () => void, onCategories: () => void }) {
  const { profile, categories, transactions } = useBudget();
  const { user, logOut } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const totalSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);

  const menuItems = [
    { label: 'Budget Settings', sub: 'Adjust limits & currency', icon: Settings, color: '#00A884', bg: '#D9FDD3', onClick: () => Alert.alert("Coming Soon", "Settings module is being optimized for native.") },
    { label: 'Budget Categories', sub: 'Manage & edit spending limits', icon: LayoutGrid, color: '#008069', bg: '#ecfdf5', onClick: onCategories },
    { label: 'Monthly Reset', sub: 'Resets on 1st of every month', icon: CalendarRange, color: '#ea580c', bg: '#fff7ed' },
    { label: 'Export Data', sub: 'Download as CSV or PDF', icon: FileText, color: '#9333ea', bg: '#faf5ff', onClick: () => Alert.alert('Export', 'Exporting data... Feature coming soon!') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#667781" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{user?.displayName?.charAt(0) || 'U'}</Text>
            </View>
          )}
        </View>
        <View style={styles.userText}>
          <Text style={styles.userName}>{profile?.displayName || user?.displayName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.memberSince}>Member since Jan 2025</Text>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statAmount}>₹ {totalSpent.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Spent this month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statAmount, { color: '#00A884' }]}>{transactions.length}</Text>
          <Text style={styles.statLabel}>Payments made</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity 
            key={idx}
            onPress={item.onClick}
            style={styles.menuItem}
            activeOpacity={0.6}
          >
            <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={styles.menuLabelContainer}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <ChevronRight size={16} color="rgba(102, 119, 129, 0.2)" />
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          onPress={logOut}
          style={styles.menuItem}
          activeOpacity={0.6}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#fff1f2' }]}>
            <LogOut size={20} color="#f43f5e" />
          </View>
          <View style={styles.menuLabelContainer}>
            <Text style={[styles.menuLabel, { color: '#f43f5e' }]}>Sign out</Text>
            <Text style={styles.menuSub}>Log out of this account</Text>
          </View>
          <ChevronRight size={16} color="rgba(244, 63, 94, 0.1)" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111B21',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D9FDD3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008069',
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111B21',
  },
  userEmail: {
    fontSize: 14,
    color: '#667781',
    opacity: 0.8,
  },
  memberSince: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00A884',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(240, 242, 245, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.05)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111B21',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(102, 119, 129, 0.6)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  menuContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(102, 119, 129, 0.05)',
    gap: 16,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabelContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111B21',
  },
  menuSub: {
    fontSize: 11,
    color: 'rgba(102, 119, 129, 0.4)',
    fontWeight: '500',
  }
});
