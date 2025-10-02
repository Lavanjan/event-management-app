import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('organization_permissions')
@Index(['organizationId'])
@Index(['permissionKey'])
@Unique(['organizationId', 'permissionKey'])
export class OrganizationPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
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

  @Column({ default: false })
  enabled: boolean;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
