import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppEnvironment } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  const configService = app.get<ConfigService<AppEnvironment>>(ConfigService);
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') ?? true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
  });

  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    reply.header('Cross-Origin-Resource-Policy', 'same-origin');
    return payload;
  });

  const config = new DocumentBuilder()
    .setTitle('Türkiye E-İmar Platform API')
    .setDescription('Backend foundation for source discovery, connector orchestration, parcel queries, and GIS analysis.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const webDistPath = join(process.cwd(), 'apps', 'e_imar_web', 'dist');
  if (existsSync(webDistPath)) {
    await app.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
      index: 'index.html',
      wildcard: false
    });
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[bootstrap] ${message}`);
  process.exit(1);
});
