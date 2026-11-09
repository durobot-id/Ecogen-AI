import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const stats = await FirebaseDB.getDashboardStats();
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat statistik dashboard.' },
      { status: 500 }
    );
  }
}
