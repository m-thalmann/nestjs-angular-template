import { User } from '@backend/user';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn()
  declare id: number;

  @Column('uuid', { generated: 'uuid' })
  declare uuid: string;

  @Column('integer', { name: 'user_id' })
  declare userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  declare user: Promise<User>;

  @Column('integer')
  declare version: number;

  @Column('varchar')
  declare name: string | null;

  @Column('datetime', { name: 'expires_at' })
  declare expiresAt: Date | null;

  @Column('datetime', { name: 'created_at' })
  declare createdAt: Date;

  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    this.createdAt = new Date();
  }
}
