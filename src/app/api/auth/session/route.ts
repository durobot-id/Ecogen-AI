import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      role: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    role: session.role,
    name: session.name,
    operatorId: session.operatorId,
  });
}
