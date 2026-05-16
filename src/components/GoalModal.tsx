import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { X, Target, Calendar, Palette } from 'lucide-react-native';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { serverTimestamp } from 'firebase/firestore';
import { Goal } from '../types';
import { format } from 'date-fns';
import { ICON_MAP } from '../lib/icons';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
}

const COLORS = ['#1D9E75', '#378ADD', '#EF9F27', '#E24B4A', '#9333ea', '#db2777'];

const GOAL_ICONS = [
  'target', 'home', 'car', 'plane', 'bike', 'gamepad', 'trophy', 
  'gift', 'laptop', 'smartphone', 'gem', 'sofa', 'construction'
];

export function GoalModal({ isOpen, onClose, goal }: GoalModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'completed'>('active');
  const [iconId, setIconId] = useState(GOAL_ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTarget(goal.targetAmount.toString());
      setMonthlyContribution(goal.monthlyContribution?.toString() || '');
      setStatus(goal.status || 'active');
      setIconId(goal.icon || GOAL_ICONS[0]);
      setColor(goal.color || COLORS[0]);
      try {
        setDeadline(format(new Date(goal.deadline), 'yyyy-MM-dd'));
      } catch (e) {
        setDeadline('');
      }
    } else {
      setTitle('');
      setTarget('');
      setMonthlyContribution('');
      setDeadline('');
      setStatus('active');
      setIconId(GOAL_ICONS[0]);
      setColor(COLORS[0]);
    }
  }, [goal, isOpen]);

  const handleSubmit = async () => {
    if (!user || !title || !target || !deadline) return;

    setIsSubmitting(true);
    try {
      const goalsPath = FirestoreService.getGoalsPath(user.uid);
      
      if (goal) {
        await FirestoreService.updateDocument(goalsPath, goal.id, {
          title,
          targetAmount: Number(target),
          monthlyContribution: monthlyContribution ? Number(monthlyContribution) : 0,
          deadline: new Date(deadline),
          status,
          icon: iconId,
          color,
          updatedAt: serverTimestamp(),
        });
      } else {
        const id = Math.random().toString(36).substring(7);
        await FirestoreService.createDocument(goalsPath, id, {
          userId: user.uid,
          title,
          targetAmount: Number(target),
          currentAmount: 0,
          monthlyContribution: monthlyContribution ? Number(monthlyContribution) : 0,
          deadline: new Date(deadline),
          status,
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
              <Text style={styles.title}>{goal ? 'Edit Savings Goal' : 'New Savings Goal'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Goal Name</Text>
                <View style={styles.inputWrapper}>
                  <Target color="#9ca3af" size={18} style={styles.inputIcon} />
                  <TextInput 
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    placeholder="e.g. Dream Car, Emergency Fund"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Target (₹)</Text>
                  <TextInput 
                    value={target}
                    onChangeText={setTarget}
                    keyboardType="numeric"
                    style={styles.inputSimple}
                    placeholder="50000"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Save/mo (₹)</Text>
                  <TextInput 
                    value={monthlyContribution}
                    onChangeText={setMonthlyContribution}
                    keyboardType="numeric"
                    style={styles.inputSimple}
                    placeholder="2000"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Deadline Date (YYYY-MM-DD)</Text>
                <View style={styles.inputWrapper}>
                  <Calendar color="#9ca3af" size={16} style={styles.inputIcon} />
                  <TextInput 
                    value={deadline}
                    onChangeText={setDeadline}
                    style={styles.input}
                    placeholder="2025-12-31"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Choose Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconsRow}>
                  {GOAL_ICONS.map((id) => {
                    const Icon = ICON_MAP[id] || Target;
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
                </ScrollView>
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Palette size={12} color="#9ca3af" />
                  <Text style={[styles.label, {marginLeft: 6}]}>Goal Color</Text>
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

              <View style={styles.field}>
                <Text style={styles.label}>Goal Status</Text>
                <View style={styles.statusRow}>
                  {(['active', 'inactive'] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setStatus(s)}
                      style={[
                        styles.statusBtn,
                        status === s && styles.statusBtnActive
                      ]}
                    >
                      <Text style={[
                        styles.statusText,
                        status === s && styles.statusTextActive
                      ]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={isSubmitting || !title || !target || !deadline}
                style={[styles.submitBtn, (isSubmitting || !title || !target || !deadline) && styles.disabledBtn]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{goal ? 'Update Goal' : 'Create Goal'}</Text>
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
    gap: 20,
  },
  field: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  labelRow: {
    flexDirection: 'row',
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 242, 245, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
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
  inputSimple: {
    backgroundColor: 'rgba(240, 242, 245, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(102, 119, 129, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111B21',
  },
  iconsRow: {
    gap: 12,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
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
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  statusBtnActive: {
    backgroundColor: '#00A884',
    borderColor: '#00A884',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  statusTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#00A884',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
