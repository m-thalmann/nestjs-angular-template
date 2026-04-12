import { Role } from '@shared/api-interfaces';
import { isNotNull } from '@shared/common';
import * as argon2 from 'argon2';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// TODO: add validator for secure password

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  declare id: number;

  @Column('uuid', { generated: 'uuid' })
  declare uuid: string;

  @Column('varchar')
  declare name: string;

  @Column('varchar')
  declare email: string;

  @Column('datetime', { name: 'email_verified_at' })
  emailVerifiedAt: Date | null = null;

  @Column('varchar')
  declare password: string;

  @Column('varchar')
  declare role: Role;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  get isEmailVerified(): boolean {
    return isNotNull(this.emailVerifiedAt);
  }

  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    this.password = await argon2.hash(this.password);
  }

  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    let passwordNeedsRehash = false;

    try {
      passwordNeedsRehash = argon2.needsRehash(this.password);
    } catch {
      // password is not hashed
      passwordNeedsRehash = true;
    }

    if (passwordNeedsRehash) {
      this.password = await argon2.hash(this.password);
    }
  }
}
