import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin', 'kasir']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'ALL';
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const limit = Number(searchParams.get('limit')) || 100;

    let transactions = await FirebaseDB.getTransactions(limit);

    if (type !== 'ALL') {
      transactions = transactions.filter((t) => t.type === type);
    }

    if (q) {
      transactions = transactions.filter(
        (t) =>
          t.nama.toLowerCase().includes(q) ||
          t.uid.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.kelas.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error: any) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil riwayat transaksi.' },
      { status: 500 }
    );
  }
}
