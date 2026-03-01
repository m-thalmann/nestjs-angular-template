import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { appConfigDefinition, databaseConfigDefinition } from './config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      cache: true,
      envFilePath: resolve(
        // check whether the app is in dev-serve or build-run -> different location of .env file
        process.env.NX_WORKSPACE_ROOT ? `${process.env.NX_WORKSPACE_ROOT}/apps/backend/src` : __dirname,
        '.env',
      ),
      load: [appConfigDefinition, databaseConfigDefinition],
    }),
  ],
  providers: [],
  exports: [],
})
export class CommonModule {}
