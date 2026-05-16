import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, Modal } from 'react-native';
import { 
  ArrowLeft, Plus, Edit2, Trash2, AlertCircle, Target, LayoutGrid
} from 'lucide-react-native';
import { useBudget } from '../context/BudgetContext';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { getIconById } from '../lib/icons';
import { Category, Goal } from '../types';

// For simplicity in conversion, I'll assume the modals are handled or I'll implement simple versions here
// Real Expo Snack projects often prefer everything in fewer files or very clear structure.

export function CategoriesView({ onBack }: { onBack: () => void }) {
  const { categories, profile, goals } = useBudget();
  const { user } = useAuth();
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const getCategoryIcon = (cat: Category) => {
    const Icon = getIconById(cat.icon || '', LayoutGrid);
    return <Icon size={18} color={cat.color || '#667781'} />;
  };

  const getGoalIcon = (goal: Goal) => {
    const Icon = getIconById(goal.icon || '', Target);
    return <Icon size={18} color={goal.color || '#00A884'} />;
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
             try {
               await FirestoreService.deleteDocument(FirestoreService.getCategoriesPath(user.uid), id);
             } catch (err) {
               console.error(err);
             }
          }
        }
      ]
    );
  };

  const activeGoalsForList = goals.filter(g => g.status !== 'completed');
  const totalCatAllocated = categories.reduce((acc, cat) => acc + cat.monthlyLimit, 0);
  const totalGoalAllocated = activeGoalsForList.reduce((acc, goal) => acc + (goal.monthlyContribution || 0), 0);
  const totalAllocated = totalCatAllocated + totalGoalAllocated;
  const totalBudget = profile?.monthlyBudget || 0;
  const allocationPercent = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#667781" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity onPress={() => Alert.alert("Add Category", "Manual entry is being ported.")} style={styles.addButton}>
          <Plus color="#667781" size={16} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summarySub}>{new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()} Allocation</Text>
            <View style={styles.summaryAmountRow}>
               <Text style={styles.totalAllocatedText}>₹{totalAllocated.toLocaleString()}</Text>
               <Text style={styles.totalBudgetText}>/ ₹{totalBudget.toLocaleString()}</Text>
            </View>
          </View>
          <View style={[styles.percentBadge, allocationPercent > 100 ? styles.percentBadgeRed : styles.percentBadgeTeal]}>
             <Text style={styles.percentText}>{allocationPercent.toFixed(0)}%</Text>
             <Text style={styles.percentSub}>Planned</Text>
          </View>
        </View>

        <View style={styles.splitGrid}>
           <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Spend Allocation</Text>
              <Text style={styles.splitAmount}>₹{totalCatAllocated.toLocaleString()}</Text>
              <View style={styles.miniBarBg}>
                 <View style={[styles.miniBarFill, { backgroundColor: '#f97316', width: `${(totalCatAllocated / (totalAllocated || 1)) * 100}%` }]} />
              </View>
           </View>
           <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Save Allocation</Text>
              <Text style={[styles.splitAmount, { color: '#00A884' }]}>₹{totalGoalAllocated.toLocaleString()}</Text>
              <View style={styles.miniBarBg}>
                 <View style={[styles.miniBarFill, { backgroundColor: '#00A884', width: `${(totalGoalAllocated / (totalAllocated || 1)) * 100}%` }]} />
              </View>
           </View>
        </View>

        <View style={styles.overallSection}>
           <Text style={styles.splitLabel}>Overall Budget Utilization</Text>
           <View style={styles.overallBarBg}>
              <View style={[styles.overallBarPart, { backgroundColor: '#fb923c', width: `${(totalCatAllocated / (totalBudget || 1)) * 100}%` }]} />
              <View style={[styles.overallBarPart, { backgroundColor: '#00A884', width: `${(totalGoalAllocated / (totalBudget || 1)) * 100}%` }]} />
           </View>
           <View style={styles.legend}>
              <View style={styles.legendItem}>
                 <View style={[styles.legendDot, { backgroundColor: '#fb923c' }]} />
                 <Text style={styles.legendText}>Spending</Text>
              </View>
              <View style={styles.legendItem}>
                 <View style={[styles.legendDot, { backgroundColor: '#00A884' }]} />
                 <Text style={styles.legendText}>Savings</Text>
              </View>
           </View>
        </View>

        {allocationPercent > 100 && (
          <View style={styles.warningBox}>
             <AlertCircle size={18} color="#ef4444" />
             <Text style={styles.warningText}>
                Warning: You have allocated ₹{(totalAllocated - totalBudget).toLocaleString()} more than your budget.
             </Text>
          </View>
        )}
      </View>

      <View style={styles.listSection}>
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Spend Budget</Text>
           <Text style={styles.sectionInfo}>₹{totalCatAllocated.toLocaleString()} Total</Text>
        </View>
        <View style={styles.cardList}>
          {categories.map((cat) => {
            const percent = (cat.spent / cat.monthlyLimit) * 100;
            const remaining = cat.monthlyLimit - cat.spent;
            return (
              <View key={cat.id} style={styles.listItem}>
                <View style={[styles.iconBox, { backgroundColor: `${cat.color}15` }]}>
                  {getCategoryIcon(cat)}
                </View>
                <View style={styles.listDetails}>
                   <View style={styles.listTopRow}>
                      <Text style={styles.itemName}>{cat.name}</Text>
                      <View style={styles.itemActions}>
                        <TouchableOpacity style={styles.actionBtn}>
                          <Edit2 size={12} color="rgba(102, 119, 129, 0.4)" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(cat.id)} style={styles.actionBtn}>
                          <Trash2 size={12} color="rgba(239, 68, 68, 0.4)" />
                        </TouchableOpacity>
                      </View>
                   </View>
                   <View style={styles.listMidRow}>
                      <View>
                        <Text style={styles.itemBudget}>Budget ₹{cat.monthlyLimit.toLocaleString()}</Text>
                        <Text style={styles.itemSub}>{remaining.toLocaleString()} left • {(cat.monthlyLimit / (totalBudget || 1) * 100).toFixed(1)}% of total</Text>
                      </View>
                      <View style={[styles.itemBadge, { backgroundColor: `${cat.color}15` }]}>
                        <Text style={[styles.itemBadgeText, { color: cat.color }]}>{percent.toFixed(0)}%</Text>
                      </View>
                   </View>
                   <View style={styles.barBgSmall}>
                      <View style={[styles.barFillSmall, { backgroundColor: cat.color, width: `${Math.min(percent, 100)}%` }]} />
                   </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => Alert.alert("Add Category", "Manual entry is being ported.")}
        style={styles.dashedButton}
      >
        <Plus size={16} color="#667781" />
        <Text style={styles.dashedButtonText}>Add new category</Text>
      </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
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
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.1)',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.1)',
    gap: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summarySub: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  totalAllocatedText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111B21',
  },
  totalBudgetText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
  },
  percentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentBadgeTeal: {
    backgroundColor: '#00A884',
  },
  percentBadgeRed: {
    backgroundColor: '#fee2e2',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
  },
  percentBadgeRedText: {
    color: '#ef4444',
  },
  percentSub: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
  },
  splitGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  splitItem: {
    flex: 1,
    gap: 4,
  },
  splitLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  splitAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111B21',
  },
  miniBarBg: {
    height: 4,
    backgroundColor: 'rgba(102, 119, 129, 0.1)',
    borderRadius: 2,
    marginTop: 4,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  overallSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  overallBarBg: {
    height: 8,
    backgroundColor: 'rgba(102, 119, 129, 0.1)',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  overallBarPart: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },
  warningText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ef4444',
    flex: 1,
  },
  listSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  sectionInfo: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'rgba(102, 119, 129, 0.5)',
    textTransform: 'uppercase',
  },
  cardList: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.1)',
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(102, 119, 129, 0.05)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listDetails: {
    flex: 1,
  },
  listTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111B21',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 4,
  },
  listMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  itemBudget: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#667781',
  },
  itemSub: {
    fontSize: 9,
    color: 'rgba(102, 119, 129, 0.5)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  barBgSmall: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
  },
  barFillSmall: {
    height: '100%',
    borderRadius: 2,
  },
  dashedButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(102, 119, 129, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dashedButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#667781',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});
