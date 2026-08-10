// Configurações do ambiente
export const env = {
  api: {
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1',
    timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  },
  auth: {
    tokenKey: process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'accessTokenOrbitaVisionerp@',
    refreshTokenKey: process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refreshTokenOrbitaVisionerp@',
    userKey: process.env.NEXT_PUBLIC_USER_KEY || 'userkeyOrbitaVisionerp@',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Orbita ERP',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    env: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  },
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableMaintenance: process.env.NEXT_PUBLIC_ENABLE_MAINTENANCE === 'true',
  },
  mozambique: {
    defaultCountry: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || 'Moçambique',
    defaultCurrency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'MZN',
    defaultTimezone: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Africa/Maputo',
    defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'pt-MZ',
  },
  pagination: {
    defaultPageSize: Number(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE) || 10,
    maxPageSize: Number(process.env.NEXT_PUBLIC_MAX_PAGE_SIZE) || 100,
  },
  upload: {
    maxFileSize: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 5242880,
    allowedTypes: process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
  },
} as const;

// Validação do ambiente
if (typeof window !== 'undefined') {
  console.log(`🚀 ${env.app.name} v${env.app.version} - ${env.app.env}`);
  console.log(`📍 API: ${env.api.url}`);
  console.log(`🌍 ${env.mozambique.defaultCountry} - ${env.mozambique.defaultCurrency}`);
}