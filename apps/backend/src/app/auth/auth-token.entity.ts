import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users';
import { AuthTokenType } from './dto/auth-token-type.dto';

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('uuid', { generated: 'uuid' })
  uuid!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: Promise<User>;

  @Column('varchar')
  name!: string | null;

  @Column('varchar')
  type!: AuthTokenType;

  @Column('uuid', { name: 'group_uuid' })
  groupUuid!: string | null;

  @Column('datetime', { name: 'expires_at' })
  expiresAt!: Date | null;

  @Column('datetime', { name: 'created_at' })
  createdAt!: Date;

  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    this.createdAt = new Date();
  }
}

// TODO: add schedule to delete expired tokens
