import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('user_permissions')
@Index(['userId'])
@Index(['organizationId'])
@Index(['permissionKey'])
@Index(['enabled'])
@Unique(['userId', 'permissionKey'])
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

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

  @Column({ default: 'grant' })
  type: 'grant' | 'deny'; // Whether this is granting or denying the permission

  @Column({ name: 'granted_by', type: 'uuid', nullable: true })
  grantedBy: string; // User who granted this permission

  @Column({ name: 'granted_at', type: 'timestamp', nullable: true })
  grantedAt: Date;

  @Column({ nullable: true })
  reason: string; // Reason for granting/denying this permission

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Helper methods
  isGranted(): boolean {
    return this.enabled && this.type === 'grant' && !this.deletedAt;
  }

  isDenied(): boolean {
    return this.enabled && this.type === 'deny' && !this.deletedAt;
  }
}
