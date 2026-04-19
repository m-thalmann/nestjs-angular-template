import { ObjectValues } from '@shared/common';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../user.entity';

export const UserActionTokenType = {
  EmailVerification: 'emailVerification',
  PasswordReset: 'passwordReset',
} as const;

export type UserActionTokenType = ObjectValues<typeof UserActionTokenType>;

@Entity('user_action_tokens')
export class UserActionToken {
  @PrimaryColumn()
  declare token: string;

  @Column('varchar')
  declare type: UserActionTokenType;

  @Column('integer', { name: 'user_id' })
  declare userId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column('json')
  declare data: Record<string, unknown> | null;

  @Column('datetime', { name: 'expires_at' })
  declare expiresAt: Date;
}
