import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';

interface RouteContext {
  params: Promise<{ uid: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth(req, ['admin', 'kasir']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { uid } = await params;
    const student = await FirebaseDB.getStudentByUid(uid);

    if (!student) {
      return NextResponse.json(
        { success: false, message: `Siswa dengan UID ${uid} tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil detail siswa.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { uid } = await params;
    const body = await req.json();

    const updated = await FirebaseDB.updateStudent(uid, {
      nama: body.nama,
      kelas: body.kelas,
      status: body.status,
    });

    return NextResponse.json({
      success: true,
      message: 'Data siswa berhasil diperbarui.',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui data siswa.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { uid } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    await FirebaseDB.deleteStudent(uid, permanent);

    return NextResponse.json({
      success: true,
      message: permanent
        ? `Siswa dengan UID ${uid} berhasil dihapus permanen.`
        : `Siswa dengan UID ${uid} berhasil dinonaktifkan.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menghapus siswa.' },
      { status: 400 }
    );
  }
}
