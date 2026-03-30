import { User } from '@backend/user';

export type SimplePermissionDefinition = [string];
export type ConditionalPermissionDefinition<TEntity> = [string, (user: User, entity: TEntity) => boolean];

export type PermissionDefinition<TEntity> = ConditionalPermissionDefinition<TEntity> | SimplePermissionDefinition;
