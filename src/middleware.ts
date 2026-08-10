import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PLATFORM_TOKEN_KEY = 'platformAccessToken';
const COMPANY_TOKEN_KEY = 'accessTokenorbitavisionapi@2026';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 Middleware - Pathname:', pathname);

  // Rotas da plataforma (Super Admin)
  const platformRoutes = ['/platform-login', '/super-admin', '/platform', '/companies', '/users-platform', '/roles-platform', ];
  const isPlatformRoute = platformRoutes.some(route => pathname.startsWith(route));

  // Rotas das empresas (Company Users)
  const isCompanyRoute = pathname === '/' || 
                         pathname === '/dashboard' ||
                         pathname === '/login' ||
                         pathname === '/change-password' ||
                         pathname.startsWith('/students') ||
                         pathname.startsWith('/teachers') ||
                         pathname.startsWith('/enrollments') ||
                         pathname.startsWith('/users') ||
                         pathname.startsWith('/roles') ||
                         pathname.startsWith('/company/info')||
                         pathname.startsWith('/academic/academic-years');

  // Tokens
  const platformToken = request.cookies.get(PLATFORM_TOKEN_KEY)?.value;
  const companyToken = request.cookies.get(COMPANY_TOKEN_KEY)?.value;

  console.log('🔍 Middleware - Tokens:', { 
    hasPlatformToken: !!platformToken, 
    hasCompanyToken: !!companyToken 
  });

  // ============ PLATFORM ROUTES ============
  if (isPlatformRoute) {
    if (pathname === '/platform-login') {
      if (platformToken) {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      }
      return NextResponse.next();
    }

    if (!platformToken) {
      return NextResponse.redirect(new URL('/platform-login', request.url));
    }
    return NextResponse.next();
  }

  // ============ COMPANY ROUTES ============
  if (isCompanyRoute) {
    // Página de login da empresa
    if (pathname === '/login') {
      if (companyToken) {
        console.log('🔍 Middleware - Redirecionando de login para dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Change password - requer token
    if (pathname === '/change-password') {
      if (!companyToken) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }

    // Rotas protegidas da empresa
    if (!companyToken) {
      console.log('🔍 Middleware - Redirecionando para login (sem token)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Fallback - redirecionar para login
  console.log('🔍 Middleware - Fallback redirecionando para login');
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$|storage).*)',
  ],
};