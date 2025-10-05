import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('master_permissions')
@Index(['category'])
@Index(['module'])
@Unique(['key'])
export class MasterPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

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
  isActive: boolean;

  @Column({ default: true, name: 'default_enabled' })
  defaultEnabled: boolean;

  @Column({ default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
