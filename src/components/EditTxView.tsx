import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { ArrowLeft, Trash2, Check, AlertCircle } from 'lucide-react-native';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { FirestoreService } from '../lib/firestoreService';
import { Transaction } from '../types';
import { serverTimestamp } from 'firebase/firestore';

export function EditTxView({ transactionId, onBack }: { transactionId: string | null, onBack: () => void }) {
  const { transactions, categories, goals } = useBudget();
  const { user } = useAuth();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transactionId) {
      const found = transactions.find(t => t.id === transactionId);
      if (found) {
        setTx(found);
        setNote(found.note || '');
        setAmount(found.amount.toString());
      }
    }
  }, [transactionId, transactions]);

  if (!tx) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00A884" />
      </View>
    );
  }

  const handleUpdate = async () => {
    if (!user || !tx || !amount || Number(amount) <= 0) return;
    setIsSubmitting(true);
    try {
      const newAmount = Number(amount);
      const diff = newAmount - tx.amount;

      if (tx.categoryId) {
        const cat = categories.find(c => c.id === tx.categoryId);
        if (cat) {
          await FirestoreService.updateDocument(FirestoreService.getCategoriesPath(user.uid), cat.id, {
            spent: cat.spent + diff,
            updatedAt: serverTimestamp(),
          });
        } else {
          const goal = goals.find(g => g.id === tx.categoryId);
          if (goal) {
            await FirestoreService.updateDocument(FirestoreService.getGoalsPath(user.uid), goal.id, {
              currentAmount: goal.currentAmount + diff,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      await FirestoreService.updateDocument(FirestoreService.getTransactionsPath(user.uid), tx.id, {
        note,
        amount: newAmount,
        updatedAt: serverTimestamp(),
      });
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !tx) return;
    
    Alert.alert(
      "Delete Transaction",
      "Delete this transaction? Budget progress will be reverted.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              if (tx.categoryId) {
                const cat = categories.find(c => c.id === tx.categoryId);
                if (cat) {
                  await FirestoreService.updateDocument(FirestoreService.getCategoriesPath(user.uid), cat.id, {
                    spent: Math.max(0, cat.spent - tx.amount),
                    updatedAt: serverTimestamp(),
                  });
                } else {
                  const goal = goals.find(g => g.id === tx.categoryId);
                  if (goal) {
                    await FirestoreService.updateDocument(FirestoreService.getGoalsPath(user.uid), goal.id, {
                      currentAmount: Math.max(0, goal.currentAmount - tx.amount),
                      updatedAt: serverTimestamp(),
                    });
                  }
                }
              }
              await FirestoreService.deleteDocument(FirestoreService.getTransactionsPath(user.uid), tx.id);
              onBack();
            } catch (err) {
              console.error(err);
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#667781" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.txCard}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Edit Amount (₹)</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Category</Text>
          <Text style={styles.metaValue}>{tx.categoryName}</Text>
        </View>
      </View>

      <View style={[styles.field, { gap: 8 }]}>
        <Text style={styles.fieldLabel}>Edit Note</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Add a note..."
        />
      </View>

      <View style={styles.warnBox}>
        <AlertCircle color="#d97706" size={18} />
        <Text style={styles.warnText}>
          Updating the amount will automatically adjust your <Text style={{fontWeight:'bold'}}>{tx.categoryName}</Text> progress.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={handleUpdate}
          disabled={isSubmitting || !amount}
          style={[styles.updateBtn, (isSubmitting || !amount) && styles.disabledBtn]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Check color="#fff" size={18} />
              <Text style={styles.updateBtnText}>Update Transaction</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleDelete}
          disabled={isSubmitting}
          style={styles.deleteBtn}
        >
          <Trash2 color="#ef4444" size={16} />
          <Text style={styles.deleteBtnText}>Delete Transaction</Text>
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
    padding: 20,
    gap: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
  txCard: {
    backgroundColor: 'rgba(217, 253, 211, 0.2)',
    borderWidth: 1,
    borderColor: '#D9FDD3',
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00A884',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  amountInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D9FDD3',
    borderRadius: 16,
    padding: 16,
    fontSize: 24,
    fontWeight: '900',
    color: '#111B21',
  },
  divider: {
    height: 1,
    backgroundColor: '#D9FDD3',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00A884',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 10,
    fontWeight: '900',
    color: '#111B21',
    textTransform: 'uppercase',
  },
  noteInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111B21',
  },
  warnBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  warnText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '500',
    lineHeight: 16,
    flex: 1,
  },
  actions: {
    gap: 12,
    paddingTop: 12,
  },
  updateBtn: {
    backgroundColor: '#111B21',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 24,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  deleteBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
