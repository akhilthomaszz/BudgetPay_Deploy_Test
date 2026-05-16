export enum CategoryColor {
  ORANGE = '#EF9F27',
  BLUE = '#378ADD',
  RED = '#E24B4A',
  PURPLE = '#7F77DD',
  GREEN = '#1D9E75'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  monthlyBudget: number;
  currency: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  monthlyLimit: number;
  spent: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  note?: string;
  date: string;
  receiverName?: string;
  receiverUpi?: string;
  method?: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution?: number;
  deadline: string;
  icon: string;
  color: string;
  status: 'active' | 'inactive' | 'completed';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }

}
