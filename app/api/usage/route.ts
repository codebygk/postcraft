import { NextRequest, NextResponse } from 'next/server';
import { getUsage } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const used = await getUsage(ip);
  return NextResponse.json({ used });
}
