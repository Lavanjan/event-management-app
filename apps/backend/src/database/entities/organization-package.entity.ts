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
import { FeaturePackage } from './feature-package.entity';

@Entity('organization_packages')
@Index(['organizationId'])
@Index(['featurePackageId'])
@Index(['isActive'])
@Unique(['organizationId', 'featurePackageId'])
export class OrganizationPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'feature_package_id', type: 'uuid' })
  featurePackageId: string;

  @ManyToOne(() => FeaturePackage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feature_package_id' })
  featurePackage: FeaturePackage;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy: string; // Product Admin who assigned this package

  @Column({ name: 'assigned_at', type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date; // For subscription-based packages

  @Column({ nullable: true })
  notes: string; // Additional notes about the assignment

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired();
  }
}
