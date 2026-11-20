import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const data = await FirebaseDB.getLatestScannedCard(300);
    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching latest tap in admin:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal membaca status kartu terbaru.' },
      { status: 500 }
    );
  }
}
