import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, '');
}

/** Apex ↔ www, damit Registrierung/Login nicht an CORS scheitern, wenn Nutzer die „andere“ Host-Variante nutzt. */
function expandPublicSiteOrigins(base: string | undefined): string[] {
  const out = new Set<string>();
  if (!base?.trim()) return [];
  const primary = normalizeOrigin(base);
  out.add(primary);
  try {
    const u = new URL(primary);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return [...out];
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
      return [...out];
    }
    const port = u.port ? `:${u.port}` : '';
    if (host.startsWith('www.')) {
      out.add(`${u.protocol}//${host.slice(4)}${port}`);
    } else {
      out.add(`${u.protocol}//www.${host}${port}`);
    }
  } catch {
    /* ignore */
  }
  return [...out];
}

function additionalCorsFromEnv(): string[] {
  const raw = process.env.ADDITIONAL_CORS_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((s) => normalizeOrigin(s))
    .filter(Boolean);
}

function buildCorsOrigins(): string[] {
  const set = new Set<string>([
    ...expandPublicSiteOrigins(
      process.env.FRONTEND_URL || 'http://localhost:8000',
    ),
    ...expandPublicSiteOrigins(process.env.NEXT_PUBLIC_SITE_URL),
    ...additionalCorsFromEnv(),
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://[::1]:8000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  return [...set];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: buildCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Accept-Language',
      'X-Requested-With',
      'Sec-Fetch-Mode',
      'Sec-Fetch-Site',
      'Sec-Fetch-Dest',
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86_400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      /** In Produktion keine DTO-Feldnamen in Fehlertexten (weniger Informationsleckage). */
      disableErrorMessages: isProd,
    }),
  );

  const port = Number(process.env.PORT) || 3002;
  // In Docker muss auf 0.0.0.0 gebunden werden, sonst kann 127.0.0.1:PORT im Container (Healthcheck / curl) leer sein.
  if (isProd) {
    await app.listen(port, '0.0.0.0');
  } else {
    await app.listen(port);
  }
  console.log(`🚀 API Server running on http://localhost:${port}`);

  if (isProd) {
    const jwt = process.env.JWT_SECRET?.trim();
    const weakJwt =
      !jwt ||
      jwt === 'change-me-in-production' ||
      jwt === 'your-secret-key-change-in-production';
    if (weakJwt) {
      console.warn(
        '[api] JWT_SECRET fehlt oder ist noch ein Platzhalter — für Beta/Prod zwingend setzen (identisch zu apps/web JWT_SECRET / Middleware).',
      );
    }
    const fe = process.env.FRONTEND_URL?.trim();
    if (
      !fe ||
      fe.startsWith('http://localhost') ||
      fe.startsWith('http://127.')
    ) {
      console.warn(
        '[api] FRONTEND_URL sollte in Produktion die öffentliche https://-URL der Web-App sein (CORS + E-Mail-Links).',
      );
    }
    if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
      console.warn(
        '[api] SKIP_EMAIL_VERIFICATION ist aktiv — nur für interne Tests, nicht für externe Beta empfohlen.',
      );
    }
  }
}

bootstrap();
