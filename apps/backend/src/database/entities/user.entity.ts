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
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Role } from './role.entity';
// import { Organization } from './organization.entity';

export enum UserType {
  PRODUCT_ADMIN = 'product_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  ORGANIZATION_USER = 'organization_user',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['organizationId'])
@Index(['userType'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.ORGANIZATION_USER,
    name: 'user_type',
  })
  userType: UserType;

  @Column({ nullable: true, name: 'organization_id' })
  organizationId: string;

  // @ManyToOne('Organization', 'users', {
  //   nullable: true,
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'organization_id' })
  // organization: Organization;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ nullable: true, name: 'last_login' })
  lastLogin: Date;

  @Column({ nullable: true, name: 'password_reset_token' })
  @Exclude()
  passwordResetToken: string;

  @Column({ nullable: true, name: 'password_reset_expires' })
  @Exclude()
  passwordResetExpires: Date;

  @ManyToMany(() => Role, role => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  hasRole(roleName: string): boolean {
    return this.roles.some(role => role.name === roleName);
  }

  hasPermission(resource: string, action: string): boolean {
    return this.roles.some(role =>
      role.permissions.some(
        permission => permission.resource === resource && permission.action === action
      )
    );
  }

  isProductAdmin(): boolean {
    return this.userType === UserType.PRODUCT_ADMIN;
  }

  isOrganizationAdmin(): boolean {
    return this.userType === UserType.ORGANIZATION_ADMIN;
  }

  isOrganizationUser(): boolean {
    return this.userType === UserType.ORGANIZATION_USER;
  }

  canManageOrganizations(): boolean {
    return this.isProductAdmin();
  }

  canManageOrganizationUsers(): boolean {
    return this.isOrganizationAdmin() || this.isProductAdmin();
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.organizationId === organizationId;
  }

  canAccessOrganization(organizationId: string): boolean {
    if (this.isProductAdmin()) return true;
    return this.belongsToOrganization(organizationId);
  }
}
