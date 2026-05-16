import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Clock, Filter, Edit2, Trash2, LayoutGrid } from 'lucide-react-native';
import { useBudget } from '../context/BudgetContext';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { getIconById } from '../lib/icons';
import { Transaction } from '../types';

export function HistoryView({ onEdit }: { onEdit: (id: string) => void }) {
  const { transactions, categories } = useBudget();
  const { user } = useAuth();

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await FirestoreService.deleteDocument(FirestoreService.getTransactionsPath(user.uid), id);
            } catch (err) {
              console.error(err);
            }
          }
        }
      ]
    );
  };

  const getIconColor = (catName: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    return cat?.color || '#667781';
  };

  const getIcon = (catName: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    const Icon = getIconById(cat?.icon || '', LayoutGrid);
    return <Icon size={18} color={cat?.color || '#667781'} />;
  };

  // Group by date
  const grouped = transactions.reduce((acc, tx) => {
    const date = parseISO(tx.date);
    let title = format(date, 'd MMMM');
    if (isToday(date)) title = 'Today';
    else if (isYesterday(date)) title = 'Yesterday';
    
    if (!acc[title]) acc[title] = [];
    acc[title].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={12} color="#667781" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([date, txs]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateTitle}>{date}</Text>
            <View style={styles.listCard}>
              {(txs as Transaction[]).map((tx, idx) => (
                <View key={tx.id} style={[styles.txItem, idx === (txs as Transaction[]).length - 1 && styles.lastItem]}>
                  <View style={[styles.iconBox, { backgroundColor: `${getIconColor(tx.categoryName)}15` }]}>
                    {getIcon(tx.categoryName)}
                  </View>
                  <View style={styles.txDetails}>
                    <View style={styles.txRow}>
                      <Text style={styles.receiverName} numberOfLines={1}>{tx.receiverName || 'Payment'}</Text>
                      <Text style={styles.amount}>₹ {tx.amount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.txRow}>
                      <Text style={styles.note} numberOfLines={1}>{tx.note || 'No note added'}</Text>
                      <View style={styles.actions}>
                         <TouchableOpacity onPress={() => onEdit(tx.id)} style={styles.actionBtn}>
                           <Edit2 size={12} color="rgba(102, 119, 129, 0.4)" />
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => handleDelete(tx.id)} style={styles.actionBtn}>
                           <Trash2 size={12} color="rgba(244, 63, 94, 0.4)" />
                         </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.txFooter}>
                      <Text style={styles.metaText}>
                        via {tx.method || 'UPI'} • {format(parseISO(tx.date), 'h:mm a')}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: `${getIconColor(tx.categoryName)}15` }]}>
                        <Text style={[styles.badgeText, { color: getIconColor(tx.categoryName) }]}>{tx.categoryName}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {transactions.length === 0 && (
           <View style={styles.emptyContainer}>
              <Clock size={40} color="rgba(0,0,0,0.1)" />
              <Text style={styles.emptyText}>No transactions yet</Text>
           </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111B21',
  },
  filterButton: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.1)',
  },
  filterText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#667781',
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  dateGroup: {
    gap: 12,
  },
  dateTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(102, 119, 129, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 4,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.1)',
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(102, 119, 129, 0.05)',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  receiverName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111B21',
    flex: 1,
  },
  amount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#e11d48',
  },
  note: {
    fontSize: 11,
    color: '#667781',
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 9,
    color: 'rgba(102, 119, 129, 0.4)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  }
});
