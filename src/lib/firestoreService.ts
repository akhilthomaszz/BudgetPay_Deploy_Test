import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { OperationType, FirestoreErrorInfo } from '../types';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const FirestoreService = {
  // Collections paths
  getUsersPath: () => 'users',
  getUserPath: (uid: string) => `users/${uid}`,
  getCategoriesPath: (uid: string) => `users/${uid}/categories`,
  getTransactionsPath: (uid: string) => `users/${uid}/transactions`,
  getGoalsPath: (uid: string) => `users/${uid}/goals`,

  // Generic helpers
  async createDocument(path: string, id: string, data: any) {
    try {
      await setDoc(doc(db, path, id), { ...data, createdAt: serverTimestamp() });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `${path}/${id}`);
    }
  },

  async updateDocument(path: string, id: string, data: any) {
    try {
      await updateDoc(doc(db, path, id), { ...data, updatedAt: serverTimestamp() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${path}/${id}`);
    }
  },

  async deleteDocument(path: string, id: string) {
    try {
      await deleteDoc(doc(db, path, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${id}`);
    }
  },

  async getDocument(path: string, id: string) {
    try {
      const snap = await getDoc(doc(db, path, id));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `${path}/${id}`);
    }
  },

  getBatch() {
    return writeBatch(db);
  }
};
