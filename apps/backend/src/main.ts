import { HttpStatus, INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { AppModule } from './app/app.module';
import { AppConfig, appConfigDefinition } from './common/config';
import { PaginationMetaDto } from './common/models';

function setupSwagger(app: INestApplication<unknown>, serverUrl: string): void {
  const config = new DocumentBuilder()
    .setTitle('@nestjs-angular-template API')
    .setDescription('API for @nestjs-angular-template')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .setVersion('v1')
    .setExternalDoc('OpenAPI JSON', `${serverUrl}/docs/openapi.json`)
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
    jsonDocumentUrl: '/docs/openapi.json',
    yamlDocumentUrl: '/docs/openapi.yaml',
    customSiteTitle: '@nestjs-angular-template - OpenAPI Documentation',
    useGlobalPrefix: true,
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });
}

async function bootstrap(): Promise<void> {
  // TODO: trust proxies: https://fastify.dev/docs/latest/Reference/Server/#trustproxy, https://docs.nestjs.com/security/rate-limiting#proxies
  const app = await NestFactory.create(AppModule, new FastifyAdapter({ routerOptions: { maxParamLength: 1000 } }));

  const appConfig = await app.resolve<unknown, AppConfig>(appConfigDefinition.KEY);

  const port = appConfig.port;
  const host = appConfig.host;
  const basePath = appConfig.basePath;

  // TODO: add allowed cors origins as config
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

  const serverUrl = `http://${host}:${port}${basePath}`;

  setupSwagger(app, serverUrl);

  await app.listen(port, host);
  Logger.log(`🚀 Application is running on: ${serverUrl}`);
}

bootstrap();
