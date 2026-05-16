import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { X, LayoutGrid, Palette, AlertCircle } from 'lucide-react-native';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { useBudget } from '../context/BudgetContext';
import { serverTimestamp } from 'firebase/firestore';
import { Category } from '../types';
import { ICON_MAP } from '../lib/icons';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

const COLORS = ['#EF9F27', '#E24B4A', '#1D9E75', '#378ADD', '#9333ea', '#db2777'];

const CATEGORY_ICONS = [
  'shopping-cart', 'car', 'shopping-bag', 'coffee', 'receipt', 
  'zap', 'utensils', 'heart', 'sparkles', 'layout-grid'
];

export function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const { user } = useAuth();
  const { profile, categories } = useBudget();
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [iconId, setIconId] = useState(CATEGORY_ICONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setLimit(category.monthlyLimit.toString());
      setColor(category.color || COLORS[0]);
      setIconId(category.icon || CATEGORY_ICONS[0]);
    } else {
      setName('');
      setLimit('');
      setColor(COLORS[0]);
      setIconId(CATEGORY_ICONS[0]);
    }
  }, [category, isOpen]);

  const totalBudget = profile?.monthlyBudget || 0;
  const otherAllocated = categories
    .filter(c => c.id !== category?.id)
    .reduce((acc, c) => acc + c.monthlyLimit, 0);
  
  const remainingAllocated = totalBudget - otherAllocated;
  const currentLimit = Number(limit) || 0;
  const isOverBudget = currentLimit > remainingAllocated;
  const allocationPercent = totalBudget > 0 ? (currentLimit / totalBudget) * 100 : 0;

  const handleSubmit = async () => {
    if (!user || !name || !limit || isOverBudget) return;

    setIsSubmitting(true);
    try {
      const catsPath = FirestoreService.getCategoriesPath(user.uid);
      
      if (category) {
        await FirestoreService.updateDocument(catsPath, category.id, {
          name,
          monthlyLimit: Number(limit),
          color,
          icon: iconId,
          updatedAt: serverTimestamp(),
        });
      } else {
        const id = Math.random().toString(36).substring(7);
        await FirestoreService.createDocument(catsPath, id, {
          userId: user.uid,
          name,
          monthlyLimit: Number(limit),
          spent: 0,
          icon: iconId,
          color,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{category ? 'Edit Category' : 'Add Category'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Category Name</Text>
                <View style={styles.inputWrapper}>
                  <LayoutGrid color="#9ca3af" size={18} style={styles.inputIcon} />
                  <TextInput 
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    placeholder="e.g. Entertainment, Health"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Monthly Budget (₹)</Text>
                  <Text style={[styles.pctText, isOverBudget && { color: '#ef4444' }]}>
                    {allocationPercent.toFixed(1)}% of total
                  </Text>
                </View>
                <View style={[styles.inputWrapper, isOverBudget && styles.inputWrapperError]}>
                  <TextInput 
                    value={limit}
                    onChangeText={setLimit}
                    keyboardType="numeric"
                    style={[styles.input, { fontSize: 18, fontWeight: '900' }]}
                    placeholder="5000"
                  />
                  {isOverBudget && <AlertCircle color="#ef4444" size={16} />}
                </View>
                <Text style={styles.availableText}>
                  Available to allocate: <Text style={{color:'#111B21'}}>₹{remainingAllocated.toLocaleString()}</Text>
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Choose Icon</Text>
                <View style={styles.iconsGrid}>
                  {CATEGORY_ICONS.map((id) => {
                    const Icon = ICON_MAP[id] || LayoutGrid;
                    return (
                      <TouchableOpacity
                        key={id}
                        onPress={() => setIconId(id)}
                        style={[
                          styles.iconBtn,
                          iconId === id && styles.iconBtnActive
                        ]}
                      >
                        <Icon size={20} color={iconId === id ? '#fff' : '#667781'} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Palette size={12} color="#9ca3af" />
                  <Text style={[styles.label, {marginLeft: 6}]}>Brand Color</Text>
                </View>
                <View style={styles.colorsGrid}>
                  {COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColor(c)}
                      style={[
                        styles.colorBtn,
                        { backgroundColor: c },
                        color === c && styles.colorBtnActive
                      ]}
                    >
                      {color === c && <View style={styles.colorDot} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={isSubmitting || isOverBudget || !name || !limit}
                style={[styles.submitBtn, (isSubmitting || isOverBudget || !name || !limit) && styles.disabledBtn]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{category ? 'Save Changes' : 'Create Category'}</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111B21',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  form: {
    gap: 24,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pctText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00A884',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 242, 245, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputWrapperError: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111B21',
  },
  availableText: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconBtnActive: {
    backgroundColor: '#00A884',
    borderColor: '#00A884',
    elevation: 4,
  },
  colorsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  colorBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBtnActive: {
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  submitBtn: {
    backgroundColor: '#00A884',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#00A884',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  disabledBtn: {
    opacity: 0.3,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  }
});
