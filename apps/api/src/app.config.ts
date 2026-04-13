import type { INestApplication } from '@nestjs/common';

export const API_PREFIX = 'v1';

export function configureApp(app: INestApplication) {
  app.enableCors({
    origin: [process.env.WEB_ORIGIN ?? 'http://localhost:5001'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix(API_PREFIX);
}
