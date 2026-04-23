import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { decodeAuthCookieTokenValue } from './lib/auth-token-cookie';
import { isPlatformAdminFromJwtPayload } from './lib/platform-admin';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production',
);

function isPublicPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/impressum') ||
    pathname.startsWith('/datenschutz') ||
    pathname.startsWith('/agb') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/verify-newsletter') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  );
}

/** Mit gültigem Token, aber ohne Organisation: nur Setup. */
function allowedWithoutOrg(pathname: string) {
  return pathname.startsWith('/setup-workspace');
}

/** Dateien unter public/ — immer ohne Auth (auch wenn Matcher sie erwischt). */
function isPublicStaticFile(pathname: string) {
  if (pathname === '/favicon.ico' || pathname === '/favicon.svg') return true;
  /** Next Metadata: PNG-Icons & Social Preview (ImageResponse-Routen) */
  if (
    pathname === '/icon' ||
    pathname.startsWith('/icon?') ||
    pathname === '/apple-icon' ||
    pathname.startsWith('/apple-icon?') ||
    pathname === '/opengraph-image' ||
    pathname.startsWith('/opengraph-image?') ||
    pathname === '/twitter-image' ||
    pathname.startsWith('/twitter-image?')
  ) {
    return true;
  }
  if (pathname.startsWith('/brand/')) return true;
  if (pathname === '/manifest.json') return true;
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (isPublicStaticFile(pathname)) {
    return NextResponse.next();
  }

  const rawCookie = request.cookies.get('token')?.value;
  const token = rawCookie ? decodeAuthCookieTokenValue(rawCookie) : undefined;

  /** Startseite: eingeloggte Nutzer mit Org direkt ins Dashboard. */
  if (pathname === '/' && token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const organizationId = payload.organizationId as string | null | undefined;
      const hasOrg =
        typeof organizationId === 'string' && organizationId.length > 0;
      if (hasOrg) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      /* Token ungültig — Landing wie ohne Login */
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    login.searchParams.set('session', 'missing');
    return NextResponse.redirect(login);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const organizationId = payload.organizationId as string | null | undefined;
    const hasOrg =
      typeof organizationId === 'string' && organizationId.length > 0;

    if (pathname.startsWith('/admin')) {
      if (!isPlatformAdminFromJwtPayload(payload)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    if (!hasOrg && !allowedWithoutOrg(pathname)) {
      const setup = new URL('/setup-workspace', request.url);
      return NextResponse.redirect(setup);
    }
  } catch {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    login.searchParams.set('session', 'invalid');
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

/**
 * Middleware nur ohne _next-Bundles (Performance).
 * Statische Public-Dateien werden oben per isPublicStaticFile() durchgewunken.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
