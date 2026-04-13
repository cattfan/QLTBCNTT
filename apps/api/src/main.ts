import { apiReference } from '@scalar/nestjs-api-reference';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { API_PREFIX, configureApp } from './app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('QLTBCNTT API')
    .setDescription('API documentation for the QLTBCNTT backend')
    .setVersion('v1')
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);

  app.use(
    `/${API_PREFIX}/docs`,
    apiReference({
      content: openApiDocument,
      theme: 'saturn',
      pageTitle: 'QLTBCNTT API Docs',
    }),
  );

  await app.listen(process.env.PORT ?? 1005);
}
void bootstrap();
