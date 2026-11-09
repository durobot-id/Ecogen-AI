import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, verifyPin, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, pin } = body as { role: UserRole; pin: string };

    if (!role || !pin) {
      return NextResponse.json(
        { success: false, message: 'Role dan PIN wajib diisi.' },
        { status: 400 }
      );
    }

    if (role !== 'kasir' && role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Peran tidak valid.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || 'local_user';
    const rateLimitKey = `${role}_${ip}`;

    // Check rate limit
    const { allowed, waitSeconds } = checkRateLimit(rateLimitKey);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak percobaan PIN yang salah. Silakan coba lagi dalam ${waitSeconds} detik.`,
          locked: true,
          waitSeconds,
        },
        { status: 429 }
      );
    }

    const isValid = verifyPin(role, pin);
    if (!isValid) {
      const { locked, waitSeconds: wait } = recordFailedAttempt(rateLimitKey);
      if (locked) {
        return NextResponse.json(
          {
            success: false,
            message: `PIN salah 5 kali berturut-turut. Akses dikunci selama ${wait} detik.`,
            locked: true,
            waitSeconds: wait,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, message: 'PIN yang dimasukkan salah.' },
        { status: 401 }
      );
    }

    // Success - reset attempts
    resetRateLimit(rateLimitKey);

    const token = await createSessionToken(role);
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      role,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 4 * 60 * 60, // 4 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat autentikasi.' },
      { status: 500 }
    );
  }
}
