import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
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

  @Column({ nullable: true, name: 'organization_id', type: 'uuid' })
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

  // Note: Using OneToMany relationship with RolePermission entity instead of ManyToMany
  // This allows for more granular permission management with additional metadata
  @OneToMany(() => RolePermission, rolePermission => rolePermission.role, { eager: true })
  rolePermissions: RolePermission[];

  // Computed property to get permission keys for backward compatibility
  get permissionKeys(): string[] {
    return this.rolePermissions?.map(rp => rp.permissionKey) || [];
  }

  // Legacy permissions property for backward compatibility (deprecated)
  // @ManyToMany(() => Permission, permission => permission.roles, { eager: false })
  // @JoinTable({
  //   name: 'role_permissions_legacy',
  //   joinColumn: { name: 'role_id', referencedColumnName: 'id' },
  //   inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  // })
  // permissions: Permission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  hasPermission(resource: string, action: string): boolean {
    return this.rolePermissions?.some(
      rolePermission => rolePermission.module === resource && rolePermission.action === action && rolePermission.enabled
    ) || false;
  }

  hasPermissionByKey(permissionKey: string): boolean {
    return this.rolePermissions?.some(
      rolePermission => rolePermission.permissionKey === permissionKey && rolePermission.enabled
    ) || false;
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
