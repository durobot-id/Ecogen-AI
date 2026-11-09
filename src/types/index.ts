// EcoGen AI TypeScript Definitions

export interface Student {
  uid: string;
  nama: string;
  kelas: string;
  poin: number;
  status?: 'aktif' | 'nonaktif';
  createdAt?: number;
  updatedAt?: number;
}

export type TransactionType = 'purchase' | 'topup' | 'adjust' | 'reward';
export type TransactionStatus = 'success' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  uid: string;
  nama: string;
  kelas: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: TransactionStatus;
  createdAt: number;
  operatorId: string;
  notes?: string;
}

export interface ProcessRecord {
  id: string;
  UID: string;
  createdAt?: number;
  status?: 'pending' | 'used' | 'expired';
  transactionId?: string;
  processedAt?: number;
}

export interface ActivityTemplate {
  id: string;
  nama: string;
  kategori: string;
  poin: number;
  deskripsi: string;
  tingkatKesulitan?: 'Mudah' | 'Sedang' | 'Sulit';
  status?: 'aktif' | 'nonaktif';
}

export interface DashboardStats {
  totalStudents: number;
  totalPoints: number;
  totalTransactions: number;
  totalPointsGranted: number;
  totalPointsSpent: number;
  recentTransactions: Transaction[];
  topStudents: Student[];
}

export type UserRole = 'kasir' | 'admin';

export interface SessionPayload {
  role: UserRole;
  operatorId: string;
  name: string;
  exp: number;
}
