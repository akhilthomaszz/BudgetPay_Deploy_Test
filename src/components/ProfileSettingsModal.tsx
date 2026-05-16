import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Wallet, Coins } from 'lucide-react-native';
import { FirestoreService } from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { useBudget } from '../context/BudgetContext';
import { serverTimestamp } from 'firebase/firestore';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user } = useAuth();
  const { profile } = useBudget();
  const [budget, setBudget] = useState(profile?.monthlyBudget.toString() || '20000');
  const [currency, setCurrency] = useState(profile?.currency || 'INR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await FirestoreService.updateDocument(FirestoreService.getUsersPath(), user.uid, {
        monthlyBudget: Number(budget),
        currency,
        updatedAt: serverTimestamp(),
      });
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
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Profile Settings</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Monthly Budget</Text>
                <View style={styles.inputWrapper}>
                  <Wallet color="#9ca3af" size={18} style={styles.inputIcon} />
                  <TextInput 
                    value={budget}
                    onChangeText={setBudget}
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="20000"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Currency</Text>
                <View style={[styles.inputWrapper, { backgroundColor: '#f3f4f6', opacity: 0.7 }]}>
                  <Coins color="#9ca3af" size={18} style={styles.inputIcon} />
                  <Text style={styles.fakeSelectText}>{currency === 'INR' ? 'Indian Rupee (₹)' : currency}</Text>
                </View>
                <Text style={styles.infoText}>Currency switching is being enabled for mobile soon.</Text>
              </View>

              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={[styles.saveBtn, isSubmitting && { opacity: 0.5 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Settings</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
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
  fakeSelectText: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111B21',
  },
  infoText: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  saveBtn: {
    backgroundColor: '#00A884',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    elevation: 4,
    shadowColor: '#00A884',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  }
});
