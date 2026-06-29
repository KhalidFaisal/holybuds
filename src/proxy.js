import { NextResponse } from 'next/server';

export function proxy(request) {
  // Check if user has the site access cookie
  const hasAccess = request.cookies.has('elevated_site_access');
  const { pathname } = request.nextUrl;

  // Auto-redirect authenticated admins away from login page
  if (pathname === '/admin' && request.cookies.has('admin_token')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Paths that bypass the middleware
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/password') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)
  ) {
    return NextResponse.next();
  }

  // If no access cookie, redirect to /password
  if (!hasAccess) {
    return NextResponse.redirect(new URL('/password', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
