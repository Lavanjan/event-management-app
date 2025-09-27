import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
// import { Organization } from './organization.entity';

export enum RoleScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
}

@Entity('roles')
@Index(['name', 'organizationId'], { unique: true })
@Index(['organizationId'])
@Index(['scope'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RoleScope,
    default: RoleScope.ORGANIZATION,
  })
  scope: RoleScope;

  @Column({ nullable: true, name: 'organization_id' })
  organizationId: string;

  // @ManyToOne('Organization', 'roles', {
  //   nullable: true,
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'organization_id' })
  // organization: Organization;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @ManyToMany(() => User, user => user.roles)
  users: User[];

  @ManyToMany(() => Permission, permission => permission.roles, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  hasPermission(resource: string, action: string): boolean {
    return this.permissions.some(
      permission => permission.resource === resource && permission.action === action
    );
  }

  isGlobalRole(): boolean {
    return this.scope === RoleScope.GLOBAL;
  }

  isOrganizationRole(): boolean {
    return this.scope === RoleScope.ORGANIZATION;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.organizationId === organizationId;
  }
}
