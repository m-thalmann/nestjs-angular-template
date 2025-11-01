import { ConfigService } from '@backend/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';

async function bootstrap(): Promise<void> {
  // TODO: trust proxies: https://fastify.dev/docs/latest/Reference/Server/#trustproxy, https://docs.nestjs.com/security/rate-limiting#proxies
  const app = await NestFactory.create(AppModule, new FastifyAdapter({ routerOptions: { maxParamLength: 1000 } }));

  const configService = app.get(ConfigService);

  const port = configService.app.port;
  const basePath = configService.app.basePath;

  // TODO: add allowed cors origins as config
  app.enableCors();
  app.setGlobalPrefix(basePath);

  const serverUrl = `http://localhost:${port}${basePath}`;

  await app.listen(port);

  app.setGlobalPrefix(basePath);

  Logger.log(`🚀 Application is running on: ${serverUrl}`);
}

bootstrap();
