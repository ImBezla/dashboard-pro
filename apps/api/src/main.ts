import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:8000',
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://[::1]:8000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Changed to false to allow debugging
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false, // Show detailed error messages
    }),
  );

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 API Server running on http://localhost:${port}`);

  if (process.env.NODE_ENV === 'production') {
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
    if (!fe || fe.startsWith('http://localhost') || fe.startsWith('http://127.')) {
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
