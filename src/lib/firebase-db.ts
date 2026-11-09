import { Student, ProcessRecord, Transaction, ActivityTemplate, DashboardStats } from '@/types';

const DB_URL = (
  process.env.FIREBASE_DATABASE_URL ||
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://ecopoint-database-default-rtdb.asia-southeast1.firebasedatabase.app'
).replace(/\/$/, '');

// Low-level REST fetcher
async function fetchRTDB<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${DB_URL}/${path.replace(/^\//, '')}.json`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Firebase RTDB Error (${res.status} ${res.statusText}): ${errorText}`);
  }

  return res.json() as Promise<T>;
}

// Parse timestamp from key like "2026-11-09_19-55-57" or numeric
export function parseProcessTimestamp(key: string, createdAt?: number): number {
  if (createdAt && typeof createdAt === 'number') {
    return createdAt;
  }

  // Format: YYYY-MM-DD_HH-mm-ss
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})$/);
  if (match) {
    const [_, year, month, day, hour, min, sec] = match;
    const date = new Date(Date.UTC(+year, +month - 1, +day, +hour - 7, +min, +sec)); // UTC+7 offset for local WIB
    return date.getTime();
  }

  const parsed = Date.parse(key.replace('_', ' '));
  if (!isNaN(parsed)) {
    return parsed;
  }

  const numeric = Number(key);
  if (!isNaN(numeric) && numeric > 1000000000) {
    return numeric;
  }

  return Date.now();
}

export const FirebaseDB = {
  // -------------------------------------------------------------
  // STUDENTS (/Siwa)
  // -------------------------------------------------------------
  async getStudents(): Promise<Student[]> {
    const data = await fetchRTDB<Record<string, Partial<Student>>>('Siwa');
    if (!data) return [];

    return Object.entries(data).map(([uid, item]) => ({
      uid,
      nama: item.nama || 'Tanpa Nama',
      kelas: item.kelas || '-',
      poin: Number(item.poin) || 0,
      status: item.status || 'aktif',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  },

  async getStudentByUid(uid: string): Promise<Student | null> {
    if (!uid) return null;
    const cleanUid = uid.trim().toUpperCase();
    const data = await fetchRTDB<Partial<Student>>(`Siwa/${cleanUid}`);
    if (!data || !data.nama) return null;

    return {
      uid: cleanUid,
      nama: data.nama,
      kelas: data.kelas || '-',
      poin: Number(data.poin) || 0,
      status: data.status || 'aktif',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },

  async createStudent(student: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<Student> {
    const cleanUid = student.uid.trim().toUpperCase();
    const existing = await this.getStudentByUid(cleanUid);
    if (existing) {
      throw new Error(`Siswa dengan UID ${cleanUid} sudah terdaftar.`);
    }

    const now = Date.now();
    const newStudent: Student = {
      uid: cleanUid,
      nama: student.nama.trim(),
      kelas: student.kelas.trim(),
      poin: Math.max(0, Number(student.poin) || 0),
      status: student.status || 'aktif',
      createdAt: now,
      updatedAt: now,
    };

    await fetchRTDB(`Siwa/${cleanUid}`, {
      method: 'PUT',
      body: JSON.stringify(newStudent),
    });

    return newStudent;
  },

  async updateStudent(
    uid: string,
    updates: Partial<Pick<Student, 'nama' | 'kelas' | 'status'>>
  ): Promise<Student> {
    const cleanUid = uid.trim().toUpperCase();
    const existing = await this.getStudentByUid(cleanUid);
    if (!existing) {
      throw new Error(`Siswa dengan UID ${cleanUid} tidak ditemukan.`);
    }

    const payload: Partial<Student> = {
      updatedAt: Date.now(),
    };
    if (updates.nama !== undefined) payload.nama = updates.nama.trim();
    if (updates.kelas !== undefined) payload.kelas = updates.kelas.trim();
    if (updates.status !== undefined) payload.status = updates.status;

    await fetchRTDB(`Siwa/${cleanUid}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return { ...existing, ...payload };
  },

  async deleteStudent(uid: string, permanent = false): Promise<void> {
    const cleanUid = uid.trim().toUpperCase();
    if (permanent) {
      await fetchRTDB(`Siwa/${cleanUid}`, {
        method: 'DELETE',
      });
    } else {
      await this.updateStudent(cleanUid, { status: 'nonaktif' });
    }
  },

  // -------------------------------------------------------------
  // PROSES (/Proses) - RFID tap detection
  // -------------------------------------------------------------
  async getAllProcesses(): Promise<ProcessRecord[]> {
    const data = await fetchRTDB<Record<string, { UID: string; createdAt?: number; status?: string; transactionId?: string }>>('Proses');
    if (!data) return [];

    const list: ProcessRecord[] = Object.entries(data).map(([id, item]) => {
      const createdAt = parseProcessTimestamp(id, item.createdAt);
      return {
        id,
        UID: (item.UID || '').trim().toUpperCase(),
        createdAt,
        status: (item.status as any) || 'pending',
        transactionId: item.transactionId,
      };
    });

    // Sort descending by timestamp (newest first)
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async getLatestPendingProcess(maxAgeSeconds = 60): Promise<{
    record: ProcessRecord | null;
    ageSeconds: number;
    isExpired: boolean;
    isUsed: boolean;
  }> {
    const processes = await this.getAllProcesses();
    if (processes.length === 0) {
      return { record: null, ageSeconds: 0, isExpired: true, isUsed: false };
    }

    const newest = processes[0];
    const now = Date.now();
    const ageSeconds = Math.max(0, Math.floor((now - (newest.createdAt || now)) / 1000));
    const isExpired = ageSeconds > maxAgeSeconds;
    const isUsed = newest.status === 'used';

    return {
      record: newest,
      ageSeconds,
      isExpired,
      isUsed,
    };
  },

  async simulateTap(uid: string): Promise<ProcessRecord> {
    const cleanUid = uid.trim().toUpperCase();
    const now = new Date();
    // Format YYYY-MM-DD_HH-mm-ss
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestampKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    const newRecord = {
      UID: cleanUid,
      createdAt: now.getTime(),
      status: 'pending',
    };

    await fetchRTDB(`Proses/${timestampKey}`, {
      method: 'PUT',
      body: JSON.stringify(newRecord),
    });

    return {
      id: timestampKey,
      UID: cleanUid,
      createdAt: newRecord.createdAt,
      status: 'pending',
    };
  },

  async markProcessUsed(processId: string, transactionId: string): Promise<void> {
    await fetchRTDB(`Proses/${processId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'used',
        transactionId,
        processedAt: Date.now(),
      }),
    });
  },

  // -------------------------------------------------------------
  // TRANSAKSI (/Transaksi) & ATOMIC BALANCES
  // -------------------------------------------------------------
  async executeCashierTransaction(params: {
    amount: number;
    operatorId: string;
    targetUid?: string; // If supplied in simulate mode
    processId?: string;
  }): Promise<{
    transaction: Transaction;
    student: Student;
  }> {
    const { amount, operatorId } = params;

    if (amount <= 0) {
      throw new Error('Nominal transaksi harus lebih besar dari 0.');
    }

    // 1. Identify Process & UID
    let selectedUid: string = '';
    let selectedProcessId: string = '';

    if (params.targetUid && params.processId) {
      selectedUid = params.targetUid.trim().toUpperCase();
      selectedProcessId = params.processId;
    } else {
      const { record, isExpired, isUsed, ageSeconds } = await this.getLatestPendingProcess(60);
      if (!record || !record.UID) {
        throw new Error('Tidak ada kartu RFID yang terdeteksi. Silakan tap kartu.');
      }
      if (isUsed) {
        throw new Error('Kartu RFID ini sudah pernah digunakan untuk transaksi sebelumnya. Silakan tap ulang.');
      }
      if (isExpired) {
        throw new Error(`Data tap kartu sudah kedaluwarsa (${ageSeconds} detik lalu). Maksimal 60 detik.`);
      }

      selectedUid = record.UID;
      selectedProcessId = record.id;
    }

    // 2. Fetch Student
    const student = await this.getStudentByUid(selectedUid);
    if (!student) {
      throw new Error(`Siswa dengan UID ${selectedUid} tidak ditemukan dalam database.`);
    }

    if (student.status === 'nonaktif') {
      throw new Error(`Kartu milik ${student.nama} (${student.kelas}) berstatus nonaktif.`);
    }

    // 3. Balance Check
    if (student.poin < amount) {
      throw new Error(
        `Saldo poin tidak mencukupi. Saldo saat ini: Rp${student.poin.toLocaleString('id-ID')}, Transaksi: Rp${amount.toLocaleString('id-ID')}.`
      );
    }

    // 4. Atomic Balance Update & Transaction Log
    const balanceBefore = student.poin;
    const balanceAfter = balanceBefore - amount;
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Update Student Balance
    await fetchRTDB(`Siwa/${selectedUid}`, {
      method: 'PATCH',
      body: JSON.stringify({
        poin: balanceAfter,
        updatedAt: Date.now(),
      }),
    });

    // Mark Process Record as Used
    if (selectedProcessId) {
      await this.markProcessUsed(selectedProcessId, transactionId);
    }

    // Create Transaction Record
    const transactionRecord: Transaction = {
      id: transactionId,
      uid: selectedUid,
      nama: student.nama,
      kelas: student.kelas,
      type: 'purchase',
      amount,
      balanceBefore,
      balanceAfter,
      description: 'Pembayaran Kasir EcoPoint',
      status: 'success',
      createdAt: Date.now(),
      operatorId,
    };

    await fetchRTDB(`Transaksi/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(transactionRecord),
    });

    return {
      transaction: transactionRecord,
      student: { ...student, poin: balanceAfter },
    };
  },

  async executeTopUp(params: {
    uid: string;
    amount: number;
    reason: string;
    operatorId: string;
  }): Promise<{ transaction: Transaction; student: Student }> {
    const { uid, amount, reason, operatorId } = params;
    if (amount <= 0) {
      throw new Error('Nominal penambahan poin harus lebih besar dari 0.');
    }

    const cleanUid = uid.trim().toUpperCase();
    const student = await this.getStudentByUid(cleanUid);
    if (!student) {
      throw new Error(`Siswa dengan UID ${cleanUid} tidak ditemukan.`);
    }

    const balanceBefore = student.poin;
    const balanceAfter = balanceBefore + amount;
    const transactionId = `TOPUP_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    await fetchRTDB(`Siwa/${cleanUid}`, {
      method: 'PATCH',
      body: JSON.stringify({
        poin: balanceAfter,
        updatedAt: Date.now(),
      }),
    });

    const transactionRecord: Transaction = {
      id: transactionId,
      uid: cleanUid,
      nama: student.nama,
      kelas: student.kelas,
      type: 'topup',
      amount,
      balanceBefore,
      balanceAfter,
      description: reason || 'Top up EcoPoint',
      status: 'success',
      createdAt: Date.now(),
      operatorId,
    };

    await fetchRTDB(`Transaksi/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(transactionRecord),
    });

    return {
      transaction: transactionRecord,
      student: { ...student, poin: balanceAfter },
    };
  },

  async executeAdjustment(params: {
    uid: string;
    amount: number; // positive or negative
    reason: string;
    operatorId: string;
  }): Promise<{ transaction: Transaction; student: Student }> {
    const { uid, amount, reason, operatorId } = params;
    if (!reason || reason.trim().length === 0) {
      throw new Error('Alasan penyesuaian poin wajib diisi.');
    }

    const cleanUid = uid.trim().toUpperCase();
    const student = await this.getStudentByUid(cleanUid);
    if (!student) {
      throw new Error(`Siswa dengan UID ${cleanUid} tidak ditemukan.`);
    }

    const balanceBefore = student.poin;
    const balanceAfter = balanceBefore + amount;

    if (balanceAfter < 0) {
      throw new Error(
        `Pengurangan poin melebihi saldo siswa. Saldo saat ini: ${balanceBefore}, Penyesuaian: ${amount}.`
      );
    }

    const transactionId = `ADJ_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    await fetchRTDB(`Siwa/${cleanUid}`, {
      method: 'PATCH',
      body: JSON.stringify({
        poin: balanceAfter,
        updatedAt: Date.now(),
      }),
    });

    const transactionRecord: Transaction = {
      id: transactionId,
      uid: cleanUid,
      nama: student.nama,
      kelas: student.kelas,
      type: amount >= 0 ? 'reward' : 'adjust',
      amount: Math.abs(amount),
      balanceBefore,
      balanceAfter,
      description: `Penyesuaian Manual: ${reason}`,
      status: 'success',
      createdAt: Date.now(),
      operatorId,
    };

    await fetchRTDB(`Transaksi/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(transactionRecord),
    });

    return {
      transaction: transactionRecord,
      student: { ...student, poin: balanceAfter },
    };
  },

  async getTransactions(limit = 100): Promise<Transaction[]> {
    const data = await fetchRTDB<Record<string, Transaction>>('Transaksi');
    if (!data) return [];

    return Object.entries(data)
      .map(([id, item]) => ({
        ...item,
        id: item.id || id,
        createdAt: item.createdAt || Date.now(),
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },

  // -------------------------------------------------------------
  // DASHBOARD AGGREGATES
  // -------------------------------------------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    const [students, transactions] = await Promise.all([
      this.getStudents(),
      this.getTransactions(250),
    ]);

    const totalStudents = students.length;
    const totalPoints = students.reduce((sum, s) => sum + (s.poin || 0), 0);
    const totalTransactions = transactions.length;

    let totalPointsGranted = 0;
    let totalPointsSpent = 0;

    for (const tx of transactions) {
      if (tx.status === 'success') {
        if (tx.type === 'topup' || tx.type === 'reward') {
          totalPointsGranted += tx.amount || 0;
        } else if (tx.type === 'purchase') {
          totalPointsSpent += tx.amount || 0;
        } else if (tx.type === 'adjust') {
          // If balanceBefore > balanceAfter, it was a deduction
          if (tx.balanceBefore > tx.balanceAfter) {
            totalPointsSpent += tx.amount || 0;
          } else {
            totalPointsGranted += tx.amount || 0;
          }
        }
      }
    }

    const topStudents = [...students]
      .filter((s) => s.status !== 'nonaktif')
      .sort((a, b) => b.poin - a.poin)
      .slice(0, 5);

    const recentTransactions = transactions.slice(0, 8);

    return {
      totalStudents,
      totalPoints,
      totalTransactions,
      totalPointsGranted,
      totalPointsSpent,
      recentTransactions,
      topStudents,
    };
  },

  // -------------------------------------------------------------
  // ACTIVITIES / AI TEMPLATES (/Aktivitas)
  // -------------------------------------------------------------
  async getActivities(): Promise<ActivityTemplate[]> {
    const data = await fetchRTDB<Record<string, ActivityTemplate>>('Aktivitas');
    if (!data) return [];

    return Object.entries(data).map(([id, item]) => ({
      ...item,
      id: item.id || id,
    }));
  },

  async saveActivity(activity: Omit<ActivityTemplate, 'id'>): Promise<ActivityTemplate> {
    const id = `ACT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: ActivityTemplate = { ...activity, id, status: 'aktif' };
    await fetchRTDB(`Aktivitas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    });
    return record;
  },
};
