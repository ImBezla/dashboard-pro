import './load-env';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';
import { getCorsOriginList } from './common/cors-origins';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const httpApp = app.getHttpAdapter().getInstance() as {
      set?: (k: string, v: unknown) => void;
    };
    if (typeof httpApp?.set === 'function') {
      /** Hinter Reverse-Proxy: echte Client-IP (Throttling, Audit). */
      httpApp.set('trust proxy', 1);
    }
  }

  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: isProd
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: false }
        : false,
    }),
  );

  app.enableCors({
    origin: getCorsOriginList(isProd),
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

  await app.init();
  const prisma = app.get(PrismaService);
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[api] PostgreSQL erreichbar (Start-Check).');
  } catch (err) {
    console.error(
      '[api] PostgreSQL nicht erreichbar — DATABASE_URL / Netzwerk / Firewall prüfen (Docker z. B. Session Pooler siehe docs/SUPABASE.md).',
      err,
    );
    await app.close();
    process.exit(1);
  }

  if (isProd) {
    const jwt = process.env.JWT_SECRET?.trim();
    const weakJwt =
      !jwt ||
      jwt === 'change-me-in-production' ||
      jwt === 'your-secret-key-change-in-production' ||
      jwt.length < 24;
    if (weakJwt) {
      console.error(
        '[api] JWT_SECRET: in Produktion ein starkes Geheimnis setzen (≥24 Zeichen), identisch in API und Web — Abbruch.',
      );
      await app.close();
      process.exit(1);
    }
    const fe = process.env.FRONTEND_URL?.trim() || '';
    if (
      !fe ||
      !fe.startsWith('https://') ||
      fe.includes('localhost') ||
      fe.includes('127.0.0.1')
    ) {
      console.error(
        '[api] FRONTEND_URL muss in Produktion eine öffentliche https://-URL der Web-App sein (kein localhost). Siehe .env.deploy / docs/DEPLOYMENT.md — Abbruch.',
      );
      await app.close();
      process.exit(1);
    }
  }

  const port = Number(process.env.PORT) || 3002;
  // In Docker muss auf 0.0.0.0 gebunden werden, sonst kann 127.0.0.1:PORT im Container (Healthcheck / curl) leer sein.
  if (isProd) {
    await app.listen(port, '0.0.0.0');
  } else {
    await app.listen(port);
  }
  console.log(`🚀 API Server running on http://localhost:${port}`);

  if (isProd && process.env.SKIP_EMAIL_VERIFICATION === 'true') {
    console.warn(
      '[api] SKIP_EMAIL_VERIFICATION ist aktiv — nur für interne Tests, nicht für öffentlichen Live-Betrieb empfohlen.',
    );
  }
}

bootstrap();
