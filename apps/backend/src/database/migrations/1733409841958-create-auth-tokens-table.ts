import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { AUTH_TOKEN_TYPES } from '../../app/auth/dto/auth-token-type.dto';

export class CreateAuthTokensTable1733409841958 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auth_tokens',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'integer',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: Object.values(AUTH_TOKEN_TYPES),
          },
          {
            name: 'token',
            type: 'varchar',
            length: '64',
            isUnique: true,
          },
          {
            name: 'group_uuid',
            type: 'uuid',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'auth_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('auth_tokens');
  }
}
