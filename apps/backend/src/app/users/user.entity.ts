import * as argon2 from 'argon2';
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('uuid', { generated: 'uuid' })
  uuid!: string;

  @Column('varchar')
  name!: string;

  @Column('varchar')
  email!: string;

  @Column('datetime', { name: 'email_verified_at' })
  emailVerifiedAt!: Date | null;

  @Column('varchar')
  password!: string;

  @Column('boolean', { name: 'is_admin' })
  isAdmin!: boolean;

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

  isEmailVerified(): boolean {
    return this.emailVerifiedAt !== null;
  }
}
