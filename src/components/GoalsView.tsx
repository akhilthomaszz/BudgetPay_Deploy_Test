import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { 
  Target, Plus, Edit2, 
  CheckCircle2, Trophy, AlertCircle, ChevronRight, Lightbulb
} from 'lucide-react-native';
import { useBudget } from '../context/BudgetContext';
import { format, parseISO } from 'date-fns';
import { Goal } from '../types';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { serverTimestamp } from 'firebase/firestore';
import { getIconById } from '../lib/icons';

const { width } = Dimensions.get('window');

export function GoalsView() {
  const { goals } = useBudget();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  const activeGoals = goals.filter(g => !g.status || g.status === 'active');
  const inactiveGoals = goals.filter(g => g.status === 'inactive');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const totalSaved = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const totalMonthlySave = activeGoals.reduce((acc, goal) => acc + (goal.monthlyContribution || 0), 0);

  const handleUpdateStatus = async (goal: Goal, status: 'active' | 'inactive' | 'completed') => {
    if (!user) return;
    try {
      const goalsPath = FirestoreService.getGoalsPath(user.uid);
      await FirestoreService.updateDocument(goalsPath, goal.id, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (iconName: string, color: string) => {
    const Icon = getIconById(iconName || '', Target);
    return <Icon size={24} color={color} />;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Savings Goals</Text>
          <Text style={styles.headerSub}>
            {activeGoals.length} Active • {completedGoals.length} Achieved
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => Alert.alert("Create Goal", "Goal creation is being moved to mobile modal.")}
          style={styles.addButton}
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Saved</Text>
          <Text style={styles.statValue}>₹ {totalSaved.toLocaleString()}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#00A884', borderColor: '#00A884' }]}>
          <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Target Save/mo</Text>
          <Text style={[styles.statValue, { color: '#fff' }]}>₹ {totalMonthlySave.toLocaleString()}</Text>
        </View>
      </View>

      {/* Achievements Toggle */}
      {completedGoals.length > 0 && (
        <TouchableOpacity 
          onPress={() => setShowAchievements(!showAchievements)}
          style={styles.achievementToggle}
        >
          <View style={styles.achievementLeft}>
             <View style={styles.trophyBox}>
                <Trophy size={16} color="#d97706" />
             </View>
             <Text style={styles.achievementText}>VIEW ACHIEVEMENTS ({completedGoals.length})</Text>
          </View>
          <ChevronRight size={16} color="#fbbf24" style={{ transform: [{ rotate: showAchievements ? '90deg' : '0deg' }] }} />
        </TouchableOpacity>
      )}

      {/* Active Goals */}
      <View style={styles.listSection}>
        {activeGoals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const isTargetMet = goal.currentAmount >= goal.targetAmount;

          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalMetaRow}>
                  <View style={[styles.goalIconBox, { backgroundColor: `${goal.color}15` }]}>
                    {getIcon(goal.icon, goal.color)}
                  </View>
                  <View style={styles.goalTitleBox}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalDeadlineText}>Target: {format(parseISO(goal.deadline), 'MMM yyyy')}</Text>
                  </View>
                </View>
                <View style={styles.goalActionBox}>
                  <View style={[styles.percentBadge, { backgroundColor: isTargetMet ? '#dcfce7' : '#D9FDD3' }]}>
                    {isTargetMet ? <CheckCircle2 size={12} color="#15803d" /> : null}
                    <Text style={[styles.percentBadgeText, { color: isTargetMet ? '#15803d' : '#008069' }]}>
                       {progress.toFixed(0)}%
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.editBtn}>
                    <Edit2 size={14} color="#667781" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.amountRow}>
                   <View>
                      <Text style={styles.accumulatedAmount}>₹ {goal.currentAmount.toLocaleString()}</Text>
                      <Text style={styles.accumulatedLabel}>Accumulated</Text>
                   </View>
                   <Text style={styles.targetLabel}>Goal: ₹ {goal.targetAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.barBg}>
                   <View style={[styles.barFill, { backgroundColor: goal.color, width: `${Math.min(progress, 100)}%` }]} />
                </View>
              </View>

              {isTargetMet ? (
                <TouchableOpacity
                  onPress={() => handleUpdateStatus(goal, 'completed')}
                  style={styles.completeBtn}
                >
                  <Trophy size={14} color="#fff" />
                  <Text style={styles.completeBtnText}>Mark as Complete</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.cardFooter}>
                  {goal.monthlyContribution && goal.monthlyContribution > 0 ? (
                    <View style={styles.planInfo}>
                      <View style={styles.greenDot} />
                      <Text style={styles.planText}>
                        ₹{goal.monthlyContribution.toLocaleString()} Planned / Month
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.planInfoWarn}>
                      <AlertCircle size={10} color="#fb923c" />
                      <Text style={styles.planTextWarn}>No plan set</Text>
                    </View>
                  )}
                  <Text style={styles.leftText}>₹ {(goal.targetAmount - goal.currentAmount).toLocaleString()} Left</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Insight Section */}
      <View style={styles.insightCard}>
        <View style={styles.insightBlur} />
        <View style={styles.insightContent}>
          <View style={styles.insightIconBox}>
             <Lightbulb size={20} color="#fff" />
          </View>
          <View style={styles.insightTextBox}>
            <Text style={styles.insightTitle}>Savings Insight</Text>
            <Text style={styles.insightSub}>
              Based on your recent spending, you could save an additional <Text style={{fontWeight:'bold'}}>₹850</Text> this month by reducing 'Dining Out'.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111B21',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#00A884',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#00A884',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(240, 242, 245, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.05)',
    padding: 20,
    borderRadius: 24,
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111B21',
  },
  achievementToggle: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 16,
    borderRadius: 16,
  },
  achievementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophyBox: {
    width: 32,
    height: 32,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listSection: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    gap: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitleBox: {
     gap: 2,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111B21',
  },
  goalDeadlineText: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalActionBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  percentBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  editBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    gap: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  accumulatedAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111B21',
  },
  accumulatedLabel: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  targetLabel: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  barBg: {
    height: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  completeBtn: {
    width: '100%',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
  },
  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00A884',
  },
  planText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#667781',
    textTransform: 'uppercase',
  },
  planInfoWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  planTextWarn: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fb923c',
    textTransform: 'uppercase',
  },
  leftText: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  insightCard: {
    backgroundColor: '#111B21',
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  insightBlur: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 50,
    transform: [{ translateX: 20 }, { translateY: -20 }],
  },
  insightContent: {
    flexDirection: 'row',
    gap: 16,
    zIndex: 1,
  },
  insightIconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#00A884',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTextBox: {
    flex: 1,
    gap: 4,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
  },
  insightSub: {
    fontSize: 11,
    color: '#667781',
    fontWeight: '500',
    lineHeight: 18,
  }
});
