import { UserActionTokenType } from '@backend/user';
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUserActionTokensTable1776593053807 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_action_tokens',
        columns: [
          {
            name: 'token',
            type: 'varchar',
            isPrimary: true,
            length: '32',
          },
          {
            name: 'type',
            type: 'enum',
            enum: Object.values(UserActionTokenType),
          },
          {
            name: 'user_id',
            type: 'integer',
          },
          {
            name: 'data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'expires_at',
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
    await queryRunner.dropTable('user_action_tokens');
  }
}
