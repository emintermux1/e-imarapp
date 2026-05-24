import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.OPENAPI_EXPORT = '1';
process.env.DISCOVERY_AUTO_START = '0';
delete process.env.REDIS_URL;

async function main() {
  const { NestFactory } = await import('@nestjs/core');
  const { FastifyAdapter } = await import('@nestjs/platform-fastify');
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const { AppModule } = await import('../src/app.module');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { logger: false }
  );
  const config = new DocumentBuilder()
    .setTitle('Türkiye E-İmar Platform API')
    .setDescription('Backend foundation for source discovery, connector orchestration, parcel queries, and GIS analysis.')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const outputPath = join(process.cwd(), 'docs', 'openapi.generated.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
