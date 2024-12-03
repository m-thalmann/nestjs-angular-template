import * as argon2 from 'argon2';
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('uuid', { generated: 'uuid', unique: true })
  uuid!: string;

  @Column('varchar')
  name!: string;

  @Column('varchar', { unique: true })
  email!: string;

  @Column('datetime', { name: 'email_verified_at', default: null })
  emailVerifiedAt!: Date | null;

  @Column('varchar')
  password!: string;

  @Column('datetime', { name: 'created_at' })
  createdAt!: Date;

  @Column('datetime', { name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    this.password = await argon2.hash(this.password);

    this.createdAt = new Date();
    this.updatedAt = new Date(this.createdAt);
  }

  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    this.updatedAt = new Date();
  }
}
