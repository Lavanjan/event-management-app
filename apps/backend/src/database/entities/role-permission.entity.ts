import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity('role_permissions')
@Index(['organizationId'])
@Index(['roleId'])
@Index(['permissionKey'])
@Unique(['roleId', 'permissionKey'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'permission_key' })
  permissionKey: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  category: string;

  @Column()
  module: string;

  @Column()
  action: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true, name: 'granted_by' })
  grantedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'granted_by' })
  granter: User;

  @Column({ nullable: true, name: 'granted_at' })
  grantedAt: Date;

  @Column({ nullable: true })
  notes: string;

  // Audit fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  // Virtual properties
  get isActive(): boolean {
    return this.enabled && !this.deletedAt;
  }

  get displayName(): string {
    return `${this.name} (${this.permissionKey})`;
  }
}
