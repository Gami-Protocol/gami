import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'gami-raise',
    saleLive: process.env.NEXT_PUBLIC_SALE_LIVE === 'true',
    timestamp: new Date().toISOString(),
  });
}
