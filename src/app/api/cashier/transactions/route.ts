import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['kasir', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { amount, targetUid, processId } = body;

    const nominal = Number(amount);
    if (isNaN(nominal) || nominal <= 0) {
      return NextResponse.json(
        { success: false, message: 'Nominal transaksi harus lebih besar dari 0.' },
        { status: 400 }
      );
    }

    const result = await FirebaseDB.executeCashierTransaction({
      amount: nominal,
      operatorId: auth.session!.operatorId,
      targetUid,
      processId,
    });

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil diproses.',
      data: {
        transactionId: result.transaction.id,
        amount: result.transaction.amount,
        nama: result.student.nama,
        kelas: result.student.kelas,
        balanceBefore: result.transaction.balanceBefore,
        balanceAfter: result.transaction.balanceAfter,
        timestamp: result.transaction.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Cashier transaction error:', error);
    const msg = error.message || 'Terjadi kesalahan saat memproses transaksi.';

    // Classify error status for client display
    let errorType = 'failed';
    if (msg.includes('kedaluwarsa')) errorType = 'expired';
    else if (msg.includes('tidak ditemukan')) errorType = 'uid_not_found';
    else if (msg.includes('tidak mencukupi')) errorType = 'insufficient_point';
    else if (msg.includes('sudah pernah digunakan')) errorType = 'already_used';
    else if (msg.includes('Tidak ada kartu')) errorType = 'no_rfid';

    return NextResponse.json(
      {
        success: false,
        errorType,
        message: msg,
      },
      { status: 400 }
    );
  }
}
