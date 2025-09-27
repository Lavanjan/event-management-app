import { DataSource } from 'typeorm';
import { User, Role, Permission } from '../entities';
import * as bcrypt from 'bcrypt';

export class InitialDataSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create permissions
      const permissions = await this.createPermissions(queryRunner);
      
      // Create Product Admin role
      const adminRole = await this.createAdminRole(queryRunner, permissions);
      
      // Create initial admin user
      await this.createAdminUser(queryRunner, adminRole);

      await queryRunner.commitTransaction();
      console.log('✅ Initial data seeded successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error seeding initial data:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createPermissions(queryRunner: any): Promise<Permission[]> {
    const permissionRepository = queryRunner.manager.getRepository(Permission);
    
    const permissionsData = [
      // User management
      { name: 'Create Users', resource: 'users', action: 'create' },
      { name: 'Read Users', resource: 'users', action: 'read' },
      { name: 'Update Users', resource: 'users', action: 'update' },
      { name: 'Delete Users', resource: 'users', action: 'delete' },
      
      // Role management
      { name: 'Create Roles', resource: 'roles', action: 'create' },
      { name: 'Read Roles', resource: 'roles', action: 'read' },
      { name: 'Update Roles', resource: 'roles', action: 'update' },
      { name: 'Delete Roles', resource: 'roles', action: 'delete' },
      
      // Inventory management
      { name: 'Create Inventory', resource: 'inventory', action: 'create' },
      { name: 'Read Inventory', resource: 'inventory', action: 'read' },
      { name: 'Update Inventory', resource: 'inventory', action: 'update' },
      { name: 'Delete Inventory', resource: 'inventory', action: 'delete' },
      
      // Event management
      { name: 'Create Events', resource: 'events', action: 'create' },
      { name: 'Read Events', resource: 'events', action: 'read' },
      { name: 'Update Events', resource: 'events', action: 'update' },
      { name: 'Delete Events', resource: 'events', action: 'delete' },
      
      // Booking management
      { name: 'Create Bookings', resource: 'bookings', action: 'create' },
      { name: 'Read Bookings', resource: 'bookings', action: 'read' },
      { name: 'Update Bookings', resource: 'bookings', action: 'update' },
      { name: 'Delete Bookings', resource: 'bookings', action: 'delete' },
      
      // Financial management
      { name: 'Read Financial Reports', resource: 'reports', action: 'read' },
      { name: 'Manage Expenses', resource: 'expenses', action: 'manage' },
      { name: 'Manage Revenues', resource: 'revenues', action: 'manage' },
      
      // System administration
      { name: 'System Administration', resource: 'system', action: 'admin' },
    ];

    const permissions: Permission[] = [];
    
    for (const permData of permissionsData) {
      let permission = await permissionRepository.findOne({
        where: { resource: permData.resource, action: permData.action }
      });
      
      if (!permission) {
        permission = permissionRepository.create(permData);
        permission = await permissionRepository.save(permission);
      }
      
      permissions.push(permission);
    }

    return permissions;
  }

  private async createAdminRole(queryRunner: any, permissions: Permission[]): Promise<Role> {
    const roleRepository = queryRunner.manager.getRepository(Role);
    
    let adminRole = await roleRepository.findOne({
      where: { name: 'Product Admin' },
      relations: ['permissions']
    });

    if (!adminRole) {
      adminRole = roleRepository.create({
        name: 'Product Admin',
        description: 'Full system access with all permissions',
        permissions: permissions,
      });
      adminRole = await roleRepository.save(adminRole);
    } else {
      // Update permissions if role exists
      adminRole.permissions = permissions;
      adminRole = await roleRepository.save(adminRole);
    }

    return adminRole;
  }

  private async createAdminUser(queryRunner: any, adminRole: Role): Promise<User> {
    const userRepository = queryRunner.manager.getRepository(User);
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@eventbooking.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    let adminUser = await userRepository.findOne({
      where: { email: adminEmail },
      relations: ['roles']
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      adminUser = userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        roles: [adminRole],
      });
      
      adminUser = await userRepository.save(adminUser);
      
      console.log(`✅ Admin user created with email: ${adminEmail}`);
      console.log(`🔑 Admin password: ${adminPassword}`);
    } else {
      // Ensure admin has the admin role
      if (!adminUser.roles.some(role => role.id === adminRole.id)) {
        adminUser.roles.push(adminRole);
        adminUser = await userRepository.save(adminUser);
      }
    }

    return adminUser;
  }
}
