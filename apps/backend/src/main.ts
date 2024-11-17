import { INestApplication, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import appConfigDefinition from './app/common/config/app.config';
import { PaginationMetaDto } from './app/common/dto/pagination-meta.dto';

function setupSwagger(app: INestApplication<unknown>, serverUrl: string): void {
  const config = new DocumentBuilder()
    .setTitle('@nestjs-angular-template/source API')
    .setVersion('1.0')
    .addServer(serverUrl)
    // .addBearerAuth({
    //   type: 'http',
    //   description: 'JWT Auth token',
    //   bearerFormat: 'JWT',
    // })
    .build();

  const documentFactory: () => OpenAPIObject = () =>
    SwaggerModule.createDocument(app, config, { extraModels: [PaginationMetaDto] });

  SwaggerModule.setup('docs', app, documentFactory);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());

  const appConfig: ConfigType<typeof appConfigDefinition> = await app.resolve(appConfigDefinition.KEY);

  const port = appConfig.port;
  const basePath = appConfig.basePath;

  app.enableCors();
  app.setGlobalPrefix(basePath);

  const serverUrl = `http://localhost:${port}${basePath}`;

  setupSwagger(app, serverUrl);

  await app.listen(port, '0.0.0.0');

  Logger.log(`🚀 Application is running on: ${serverUrl}`);
}

bootstrap();
