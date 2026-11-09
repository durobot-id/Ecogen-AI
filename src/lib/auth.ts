import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SessionPayload, UserRole } from '@/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ecogen-default-secret-key-32-chars-long!!'
);

const SESSION_COOKIE_NAME = 'ecogen_session';

// In-memory rate limiting for PIN attempts
interface AttemptRecord {
  count: number;
  lockedUntil: number;
}
const attemptsMap = new Map<string, AttemptRecord>();

export function checkRateLimit(identifier: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = attemptsMap.get(identifier);

  if (record) {
    if (record.lockedUntil > now) {
      const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, waitSeconds };
    }
    // Lock expired, reset if needed
    if (record.lockedUntil > 0 && record.lockedUntil <= now) {
      attemptsMap.delete(identifier);
    }
  }

  return { allowed: true };
}

export function recordFailedAttempt(identifier: string): { locked: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = attemptsMap.get(identifier) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= 5) {
    record.lockedUntil = now + 60 * 1000; // 60s lockout
    attemptsMap.set(identifier, record);
    return { locked: true, waitSeconds: 60 };
  }

  attemptsMap.set(identifier, record);
  return { locked: false };
}

export function resetRateLimit(identifier: string) {
  attemptsMap.delete(identifier);
}

export function verifyPin(role: UserRole, pin: string): boolean {
  const expectedKasirPin = process.env.KASIR_PIN || '1234';
  const expectedAdminPin = process.env.ADMIN_PIN || '4321';

  if (role === 'kasir') {
    return pin === expectedKasirPin;
  }
  if (role === 'admin') {
    return pin === expectedAdminPin;
  }
  return false;
}

export async function createSessionToken(role: UserRole): Promise<string> {
  const payload = {
    role,
    operatorId: `${role}_${Date.now()}`,
    name: role === 'admin' ? 'Administrator' : 'Kasir EcoGen',
  };

  // Session lasts 4 hours of activity
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('4h')
    .sign(SECRET_KEY);

  return jwt;
}

export async function getSession(req?: NextRequest): Promise<SessionPayload | null> {
  try {
    let token: string | undefined;

    if (req) {
      token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }

    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ authorized: boolean; session?: SessionPayload; errorResponse?: NextResponse }> {
  const session = await getSession(req);

  if (!session) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan. Silakan masukkan PIN kembali.' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, message: 'Akses ditolak: Peran tidak memiliki izin.' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}

export { SESSION_COOKIE_NAME };
