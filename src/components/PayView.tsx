import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { 
  ArrowLeft, QrCode, Check, AlertTriangle, ExternalLink, 
  LayoutGrid, Target
} from 'lucide-react-native';
import { useBudget } from '../context/BudgetContext';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { getIconById } from '../lib/icons';

import { doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function PayView({ onBack, onComplete }: { onBack: () => void, onComplete: () => void }) {
  const { categories, profile, goals } = useBudget();
  const { user } = useAuth();
  
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState(categories[0]?.id || '');
  const [selectionType, setSelectionType] = useState<'category' | 'goal'>('category');
  const [isProcessing, setIsProcessing] = useState(false);

  const activeGoals = goals.filter(g => !g.status || g.status === 'active');

  const selectedCat = categories.find(c => c.id === selectedId);
  const selectedGoal = activeGoals.find(g => g.id === selectedId);

  const getIcon = (iconId: string, fallback: any, color: string) => {
    const Icon = getIconById(iconId || '', fallback);
    return <Icon size={16} color={color} />;
  };

  const handleSelect = (id: string, type: 'category' | 'goal') => {
    setSelectedId(id);
    setSelectionType(type);
    
    if (type === 'goal') {
      const goal = activeGoals.find(g => g.id === id);
      if (goal) {
        setAmount(goal.monthlyContribution?.toString() || '0');
        setNote(`Contribution: ${goal.title}`);
      }
    } else {
      setNote('');
    }
  };

  const spentAfter = selectedCat ? selectedCat.spent + Number(amount) : 0;
  const percentAfter = selectedCat ? (spentAfter / selectedCat.monthlyLimit) * 100 : 0;

  const handlePay = async () => {
    if (!user || !amount || Number(amount) <= 0) return;
    
    setIsProcessing(true);
    try {
      const txId = Math.random().toString(36).substring(7);
      const batch = FirestoreService.getBatch();
      
      const txData: any = {
        userId: user.uid,
        amount: Number(amount),
        note,
        date: new Date(),
        receiverName: 'Receiver',
        method: 'GPay',
        createdAt: serverTimestamp(),
      };

      if (selectionType === 'category' && selectedCat) {
        txData.categoryId = selectedCat.id;
        txData.categoryName = selectedCat.name;

        const catRef = doc(db, FirestoreService.getCategoriesPath(user.uid), selectedCat.id);
        batch.update(catRef, {
          spent: spentAfter,
          updatedAt: serverTimestamp(),
        });
      } else if (selectionType === 'goal' && selectedGoal) {
        txData.categoryId = selectedGoal.id;
        txData.categoryName = `Goal: ${selectedGoal.title}`;

        const goalRef = doc(db, FirestoreService.getGoalsPath(user.uid), selectedGoal.id);
        batch.update(goalRef, {
          currentAmount: selectedGoal.currentAmount + Number(amount),
          updatedAt: serverTimestamp(),
        });
      }

      const txRef = doc(db, FirestoreService.getTransactionsPath(user.uid), txId);
      batch.set(txRef, txData);

      await batch.commit();
      onComplete();
    } catch (e) {
      console.error("Payment failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#667781" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>Express Pay</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Selection Box */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Select Budget or Goal</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectionScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleSelect(cat.id, 'category')}
              style={[
                styles.selectButton,
                selectedId === cat.id && selectionType === 'category' && styles.selectButtonActive
              ]}
            >
              {getIcon(cat.icon, LayoutGrid, selectedId === cat.id && selectionType === 'category' ? '#fff' : '#667781')}
              <Text style={[
                styles.selectButtonText,
                selectedId === cat.id && selectionType === 'category' && styles.selectButtonTextActive
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          {activeGoals.map(goal => (
            <TouchableOpacity
              key={goal.id}
              onPress={() => handleSelect(goal.id, 'goal')}
              style={[
                styles.selectButton,
                selectedId === goal.id && selectionType === 'goal' && styles.goalButtonActive
              ]}
            >
              {getIcon(goal.icon, Target, selectedId === goal.id && selectionType === 'goal' ? '#fff' : '#00A884')}
              <Text style={[
                styles.selectButtonText,
                selectedId === goal.id && selectionType === 'goal' && styles.selectButtonTextActive
              ]}>{goal.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Inputs */}
      <View style={styles.inputSection}>
        <View style={styles.amountField}>
           <Text style={styles.inputLabel}>Amount (₹)</Text>
           <TextInput
             style={styles.amountInput}
             value={amount}
             onChangeText={setAmount}
             keyboardType="numeric"
             placeholder="0"
             placeholderTextColor="#e5e7eb"
           />
        </View>

        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="What's this for?"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Recipient Info */}
      <View style={styles.recipientCard}>
        <View style={styles.qrIconBox}>
          <QrCode color="#008069" size={24} />
        </View>
        <View style={styles.recipientInfo}>
          <Text style={styles.verifiedText}>Recipient Verified</Text>
          <Text style={styles.upiId}>rahul.sharma@okaxis</Text>
        </View>
        <Check color="#10b981" size={20} strokeWidth={3} />
      </View>

      {/* Budget Impact */}
      {selectedCat && (
        <View style={styles.impactCard}>
          <Text style={styles.impactLabel}>{selectedCat.name.toUpperCase()} AFTER PAYMENT</Text>
          <View style={styles.impactMain}>
            <Text style={styles.impactAmount}>₹ {(selectedCat.monthlyLimit - spentAfter).toLocaleString()}</Text>
            <Text style={styles.impactSub}>left</Text>
          </View>
          <View style={styles.barBg}>
             <View style={[styles.barFill, { width: `${Math.min(percentAfter, 100)}%`, backgroundColor: '#f97316' }]} />
          </View>
          <View style={styles.impactFooter}>
            <Text style={styles.impactFooterText}>{percentAfter.toFixed(0)}% budget used</Text>
            <Text style={styles.impactFooterText}>Limit: ₹{selectedCat.monthlyLimit.toLocaleString()}</Text>
          </View>
        </View>
      )}

      {selectedGoal && (
        <View style={[styles.impactCard, { backgroundColor: 'rgba(217, 253, 211, 0.2)', borderColor: '#D9FDD3' }]}>
          <Text style={[styles.impactLabel, { color: '#00A884' }]}>SAVINGS PROGRESS: {selectedGoal.title.toUpperCase()}</Text>
          <View style={styles.impactMain}>
            <Text style={styles.impactAmount}>₹ {(selectedGoal.currentAmount + Number(amount)).toLocaleString()}</Text>
            <Text style={[styles.impactSub, { color: '#00A884' }]}>saved</Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: '#D9FDD3' }]}>
             <View style={[styles.barFill, { width: `${Math.min(((selectedGoal.currentAmount + Number(amount)) / selectedGoal.targetAmount) * 100, 100)}%`, backgroundColor: '#00A884' }]} />
          </View>
          <View style={styles.impactFooter}>
            <Text style={[styles.impactFooterText, { color: '#008069' }]}>
               {(((selectedGoal.currentAmount + Number(amount)) / selectedGoal.targetAmount) * 100).toFixed(0)}% to target
            </Text>
            <Text style={styles.impactFooterText}>Target: ₹{selectedGoal.targetAmount.toLocaleString()}</Text>
          </View>
        </View>
      )}

      {/* Pay Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          onPress={handlePay}
          disabled={isProcessing || !amount || Number(amount) <= 0}
          style={[styles.payButton, (isProcessing || !amount || Number(amount) <= 0) && styles.payButtonDisabled]}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ExternalLink color="#fff" size={20} strokeWidth={3} />
              <Text style={styles.payButtonText}>Pay ₹{amount || '0'} Now</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.securityText}>Secured by UPI Protocol</Text>
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
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 4,
  },
  selectionScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  selectButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.1)',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectButtonActive: {
    backgroundColor: '#00A884',
    borderColor: '#00A884',
    elevation: 4,
  },
  goalButtonActive: {
    backgroundColor: '#008069',
    borderColor: '#008069',
    elevation: 4,
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#667781',
    textTransform: 'uppercase',
  },
  selectButtonTextActive: {
    color: '#fff',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(102, 119, 129, 0.1)',
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  inputSection: {
    gap: 20,
  },
  amountField: {
    backgroundColor: 'rgba(240, 242, 245, 0.5)',
    borderWidth: 2,
    borderColor: 'rgba(102, 119, 129, 0.05)',
    borderRadius: 28,
    padding: 20,
    paddingTop: 24,
  },
  inputLabel: {
    position: 'absolute',
    top: 8,
    left: 20,
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '900',
    color: '#111B21',
  },
  noteInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#111B21',
    fontWeight: 'bold',
  },
  recipientCard: {
    backgroundColor: 'rgba(217, 253, 211, 0.2)',
    borderWidth: 1,
    borderColor: '#D9FDD3',
    padding: 20,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qrIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#D9FDD3',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientInfo: {
    flex: 1,
  },
  verifiedText: {
    fontSize: 10,
    color: '#00A884',
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  upiId: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111B21',
  },
  impactCard: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    padding: 20,
    borderRadius: 28,
  },
  impactLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#c2410c',
    marginBottom: 12,
  },
  impactMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  impactAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#7c2d12',
  },
  impactSub: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ea580c',
    textTransform: 'uppercase',
  },
  barBg: {
    height: 8,
    backgroundColor: 'rgba(254, 215, 170, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  impactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  impactFooterText: {
    fontSize: 10,
    color: '#9a3412',
    fontWeight: '900',
  },
  bottomSection: {
    gap: 16,
    paddingTop: 16,
  },
  payButton: {
    backgroundColor: '#00A884',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 32,
    gap: 12,
    elevation: 8,
    shadowColor: '#00A884',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    borderBottomWidth: 6,
    borderBottomColor: '#008069',
  },
  payButtonDisabled: {
    opacity: 0.3,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  securityText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});
