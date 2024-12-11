import { HttpStatus, INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { AppModule } from './app/app.module';
import { appConfigDefinition } from './app/common/config';
import { PaginationMetaDto } from './app/common/dto';

// TODO: add unauthorized responses automatically to all guarded routes
function setupSwagger(app: INestApplication<unknown>, serverUrl: string): void {
  const config = new DocumentBuilder()
    .setTitle('@nestjs-angular-template/source API')
    .setDescription('API for @nestjs-angular-template/source')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .setVersion('1.0')
    .setExternalDoc('OpenAPI JSON', 'docs/openapi.json')
    .addServer(serverUrl)
    .addBearerAuth(
      {
        type: 'http',
        description: 'JWT Access token',
        bearerFormat: 'JWT',
      },
      'AccessToken',
    )
    .addBearerAuth(
      {
        type: 'http',
        description: 'JWT Refresh token',
        bearerFormat: 'JWT',
      },
      'RefreshToken',
    )
    .build();

  const documentFactory: () => OpenAPIObject = () =>
    SwaggerModule.createDocument(app, config, { extraModels: [PaginationMetaDto] });

  SwaggerModule.setup('docs', app, documentFactory, {
    jsonDocumentUrl: 'docs/openapi.json',
    customSiteTitle: '@nestjs-angular-template/source - OpenAPI Documentation',
  });
}

// TODO: add versioning
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());

  const appConfig: ConfigType<typeof appConfigDefinition> = await app.resolve(appConfigDefinition.KEY);

  const port = appConfig.port;
  const basePath = appConfig.basePath;

  app.enableCors();
  app.setGlobalPrefix(basePath);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  classValidatorUseContainer(app.select(AppModule), { fallbackOnErrors: true });

  const serverUrl = `http://localhost:${port}${basePath}`;

  setupSwagger(app, serverUrl);

  await app.listen(port, '0.0.0.0');

  Logger.log(`🚀 Application is running on: ${serverUrl}`);
}

bootstrap();
