import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PLATFORM_TOKEN_KEY = 'platformAccessToken';
const COMPANY_TOKEN_KEY = 'accessTokenorbitavisionapi@2026';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  // Rotas da plataforma (Super Admin)
  const platformRoutes = ['/platform-login', '/super-admin', '/platform', '/companies', '/users-platform', '/roles-platform', ];
  const isPlatformRoute = platformRoutes.some(route => pathname.startsWith(route));

  // Rotas das empresas (Company Users)
  const isCompanyRoute = pathname === '/' || 
                         pathname === '/dashboard' ||
                         pathname === '/login' ||
                         pathname === '/change-password' ||
                         pathname.startsWith('/academic/enrollments') ||
                         pathname.startsWith('/users') ||
                         pathname.startsWith('/roles') ||
                         pathname.startsWith('/company/info')||
                         pathname.startsWith('/academic/academic-years')||
                         pathname.startsWith('/academic/academic-structure')||
                         pathname.startsWith('/academic/program-settings')||
                         pathname.startsWith('/academic/subjects')||
                         pathname.startsWith('/academic/teachers')||
                         pathname.startsWith('/academic/students')||
                         pathname.startsWith('/academic/enrollments')||
                         pathname.startsWith('/academic/teacher-assignments')||
                         pathname.startsWith('/academic/grades')||
                         pathname.startsWith('/academic/classes') ||
                         pathname.startsWith('/academic/grade-subjects')||
                         pathname.startsWith('/academic/assessments')||
                         pathname.startsWith('/academic/my-classes')||
                         pathname.startsWith('/notifications')||
                         pathname.startsWith('/academic/assessment-rules')||
                         pathname.startsWith('/attendance')||
                         pathname.startsWith('/academic-reports')||
                         pathname.startsWith('/transcripts');

  // Tokens
  const platformToken = request.cookies.get(PLATFORM_TOKEN_KEY)?.value;
  const companyToken = request.cookies.get(COMPANY_TOKEN_KEY)?.value;

 

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
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Fallback - redirecionar para login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$|storage).*)',
  ],
};