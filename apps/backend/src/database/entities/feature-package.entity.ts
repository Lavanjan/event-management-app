import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrganizationPackage } from './organization-package.entity';

@Entity('feature_packages')
@Index(['name'])
@Index(['isActive'])
export class FeaturePackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('text', { array: true })
  features: string[]; // Array of permission keys included in this package

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'billing_cycle', default: 'monthly' })
  billingCycle: 'monthly' | 'yearly' | 'one-time';

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  color: string; // For UI display

  @Column({ nullable: true })
  icon: string; // For UI display

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @OneToMany(() => OrganizationPackage, orgPackage => orgPackage.featurePackage)
  organizationPackages: OrganizationPackage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  hasFeature(permissionKey: string): boolean {
    return this.features.includes(permissionKey);
  }

  getFeaturesByCategory(): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};
    
    for (const feature of this.features) {
      const [module] = feature.split('.');
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(feature);
    }
    
    return grouped;
  }
}
