import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express, Request, Response } from 'express';
import { HttpExceptionFilter, TransformInterceptor } from './common';

export const API_PREFIX = 'v1';
export const OPENAPI_JSON_PATH = `/${API_PREFIX}/openapi.json`;
export const API_DOCS_PATH = `/${API_PREFIX}/docs`;

export async function setupApp(app: INestApplication): Promise<void> {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors();
  app.setGlobalPrefix(API_PREFIX);

  const openApiDocument = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('QLTBCNTT API')
      .setDescription('Tai lieu API backend cho he thong QLTBCNTT')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhap JWT access token theo dinh dang Bearer',
        },
        'bearer',
      )
      .build(),
    {
      operationIdFactory: (_controllerKey, methodKey) => methodKey,
    },
  );

  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.get(OPENAPI_JSON_PATH, (_request: Request, response: Response) => {
    response.type('application/json').send(openApiDocument);
  });

  const { apiReference } = await import('@scalar/nestjs-api-reference');

  (app as NestExpressApplication).use(
    API_DOCS_PATH,
    apiReference({
      url: OPENAPI_JSON_PATH,
      theme: 'alternate',
    }),
  );
}
