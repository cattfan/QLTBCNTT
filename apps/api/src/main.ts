import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';

loadEnvironmentFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupApp(app);
  await app.listen(process.env.PORT ?? 1005);
}
void bootstrap();

function loadEnvironmentFile(): void {
  const envFileCandidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(__dirname, '../.env'),
  ];

  for (const envFilePath of envFileCandidates) {
    if (!existsSync(envFilePath)) {
      continue;
    }

    process.loadEnvFile(envFilePath);
    return;
  }
}
