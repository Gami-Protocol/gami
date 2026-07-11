import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BLOCKED = (process.env.NEXT_PUBLIC_BLOCKED_COUNTRIES ?? 'US,CU,IR,KP,SY')
  .split(',')
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean);

const SALE_PATHS = ['/sale/contribute', '/sale'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSale = SALE_PATHS.some((p) => pathname.startsWith(p));
  if (!isSale) return NextResponse.next();

  const country =
    request.headers.get('x-vercel-ip-country')?.toUpperCase() ??
    request.headers.get('cf-ipcountry')?.toUpperCase();
  if (country && BLOCKED.includes(country)) {
    const url = request.nextUrl.clone();
    url.pathname = '/legal/risk';
    url.searchParams.set('blocked', country);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/sale/:path*'],
};
