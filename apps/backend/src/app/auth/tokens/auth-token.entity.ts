import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('uuid', { generated: 'uuid' })
  uuid!: string;

  @Column('integer', { name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: Promise<User>;

  @Column('integer', { name: 'version' })
  version!: number;

  @Column('varchar')
  name!: string | null;

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
