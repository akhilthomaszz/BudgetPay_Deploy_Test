import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { getIconById } from '../lib/icons';

const { width } = Dimensions.get('window');

export function HomeView({ onScanPay, onProfileClick }: { onScanPay: () => void, onProfileClick: () => void }) {
  const { profile, categories, transactions, goals } = useBudget();
  const { user } = useAuth();

  const totalSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);
  const totalBudget = profile?.monthlyBudget || 0;
  const remaining = totalBudget - totalSpent;
  const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - today.getDate() + 1);
  const safeDailyOverall = Math.max(0, Math.floor(remaining / daysRemaining));

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.nameText}>{profile?.displayName || user?.displayName?.split(' ')[0] || 'Member'}</Text>
        </View>
        <TouchableOpacity 
          onPress={onProfileClick}
          style={styles.profileButton}
        >
          {user?.photoURL ? (
             <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
             <View style={styles.initialsContainer}>
               <Text style={styles.initialsText}>{user?.displayName?.charAt(0) || 'U'}</Text>
             </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Budget Card */}
      <View style={styles.budgetCard}>
        <Text style={styles.budgetLabel}>Total budget remaining</Text>
        <Text style={styles.remainingAmount}>₹ {remaining.toLocaleString()}</Text>
        
        <View style={styles.safeContainer}>
           <View style={styles.safeSubContainer}>
              <View style={styles.pulseDot} />
              <Text style={styles.safeText}>Safe to spend: <Text style={styles.safeAmount}>₹{safeDailyOverall.toLocaleString()}</Text> / day</Text>
           </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Budget</Text>
            <Text style={styles.statValue}>₹ {totalBudget.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, { color: '#00A884' }]}>₹ {totalSpent.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Days Left</Text>
            <Text style={styles.statValue}>{daysRemaining}</Text>
          </View>
        </View>
      </View>

      {/* Category Snapshot */}
      <View style={styles.snapSection}>
        <View style={styles.snapHeader}>
          <Text style={styles.snapTitle}>Category Snapshot</Text>
        </View>
        
        <View style={styles.listContainer}>
          {categories.slice(0, 4).map((cat) => {
            const percent = (cat.spent / cat.monthlyLimit) * 100;
            const catRemaining = cat.monthlyLimit - cat.spent;
            const safeDaily = Math.max(0, Math.floor(catRemaining / daysRemaining));
            const CategoryIcon = getIconById(cat.icon || '');

            return (
              <View key={cat.id} style={styles.catItem}>
                <View style={[styles.iconBox, { backgroundColor: `${cat.color}15` }]}>
                  <CategoryIcon color={cat.color} size={20} />
                </View>
                <View style={styles.catDetails}>
                  <View style={styles.catTopRow}>
                    <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                    <Text style={[styles.catSpent, { color: percent > 90 ? '#ef4444' : '#16a34a' }]}>
                      ₹ {cat.spent.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.catMidRow}>
                    <Text style={styles.safeTextSmall}>
                      Safe daily: <Text style={{ color: '#00A884' }}>₹{safeDaily.toLocaleString()}</Text>
                    </Text>
                    <Text style={styles.percentText}>{percent.toFixed(0)}% used</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${Math.min(percent, 100)}%`, backgroundColor: cat.color }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  greetingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D9FDD3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  initialsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#008069',
    fontWeight: 'bold',
    fontSize: 16,
  },
  budgetCard: {
    backgroundColor: 'rgba(217, 253, 211, 0.4)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 132, 0.1)',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(0, 128, 105, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  remainingAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#008069',
    marginBottom: 16,
  },
  safeContainer: {
    marginBottom: 20,
  },
  safeSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 132, 0.2)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00A884',
    marginRight: 8,
  },
  safeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#008069',
  },
  safeAmount: {
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 168, 132, 0.1)',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0, 128, 105, 0.4)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#008069',
  },
  snapSection: {
    marginTop: 20,
  },
  snapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  snapTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  catItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catDetails: {
    flex: 1,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111821',
    flex: 1,
  },
  catSpent: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  catMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  safeTextSmall: {
    fontSize: 10,
    color: '#667781',
    fontWeight: 'bold',
  },
  percentText: {
    fontSize: 10,
    color: '#d1d5db',
    fontWeight: '900',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  }
});
