import { DataSource } from 'typeorm';
import { 
  Organization, 
  User, 
  Role, 
  RolePermission, 
  OrganizationPermission,
  MasterPermission,
  UserType 
} from '../entities';
import * as bcrypt from 'bcrypt';

export class OrganizationSetupSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create a test organization
      const organization = await this.createTestOrganization(queryRunner);
      
      // Sync organization permissions with master permissions
      await this.syncOrganizationPermissions(queryRunner, organization.id);
      
      // Create organization admin role with permissions
      const adminRole = await this.createOrganizationAdminRole(queryRunner, organization.id);
      
      // Create organization user role with limited permissions
      const userRole = await this.createOrganizationUserRole(queryRunner, organization.id);
      
      // Create test organization admin user
      await this.createOrganizationAdminUser(queryRunner, organization.id, adminRole);
      
      // Create test organization user
      await this.createOrganizationUser(queryRunner, organization.id, userRole);

      await queryRunner.commitTransaction();
      console.log('✅ Organization setup seeded successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error seeding organization setup:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createTestOrganization(queryRunner: any): Promise<Organization> {
    const organizationRepository = queryRunner.manager.getRepository(Organization);
    
    let organization = await organizationRepository.findOne({
      where: { name: 'Test Organization' }
    });

    if (!organization) {
      organization = organizationRepository.create({
        name: 'Test Organization',
        slug: 'test-org',
        email: 'admin@testorg.com',
        phone: '+1234567890',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        zipCode: '12345',
        isActive: true,
        isVerified: true,
      });
      organization = await organizationRepository.save(organization);
      console.log('✅ Test organization created');
    }

    return organization;
  }

  private async syncOrganizationPermissions(queryRunner: any, organizationId: string): Promise<void> {
    const masterPermissionRepository = queryRunner.manager.getRepository(MasterPermission);
    const organizationPermissionRepository = queryRunner.manager.getRepository(OrganizationPermission);

    // Get all master permissions
    const masterPermissions = await masterPermissionRepository.find();

    // Create organization permissions for all master permissions
    for (const masterPermission of masterPermissions) {
      const existingOrgPermission = await organizationPermissionRepository.findOne({
        where: { 
          organizationId, 
          permissionKey: masterPermission.key 
        }
      });

      if (!existingOrgPermission) {
        const orgPermission = organizationPermissionRepository.create({
          organizationId,
          permissionKey: masterPermission.key,
          name: masterPermission.name,
          description: masterPermission.description,
          category: masterPermission.category,
          module: masterPermission.module,
          action: masterPermission.action,
          enabled: masterPermission.defaultEnabled,
        });
        await organizationPermissionRepository.save(orgPermission);
      }
    }

    console.log(`✅ Synced ${masterPermissions.length} organization permissions`);
  }

  private async createOrganizationAdminRole(queryRunner: any, organizationId: string): Promise<Role> {
    const roleRepository = queryRunner.manager.getRepository(Role);
    const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
    const organizationPermissionRepository = queryRunner.manager.getRepository(OrganizationPermission);

    let adminRole = await roleRepository.findOne({
      where: { name: 'Organization Admin', organizationId }
    });

    if (!adminRole) {
      adminRole = roleRepository.create({
        name: 'Organization Admin',
        description: 'Full access to organization features',
        organizationId,
        isActive: true,
      });
      adminRole = await roleRepository.save(adminRole);
    }

    // Get all enabled organization permissions
    const orgPermissions = await organizationPermissionRepository.find({
      where: { organizationId, enabled: true }
    });

    // Create role permissions for all enabled organization permissions
    for (const orgPermission of orgPermissions) {
      const existingRolePermission = await rolePermissionRepository.findOne({
        where: { 
          roleId: adminRole.id, 
          permissionKey: orgPermission.permissionKey 
        }
      });

      if (!existingRolePermission) {
        // Extract module and action from permission key (e.g., "dashboard.view" -> module: "dashboard", action: "view")
        const [module, action] = orgPermission.permissionKey.split('.');

        const rolePermission = rolePermissionRepository.create({
          organizationId,
          roleId: adminRole.id,
          permissionKey: orgPermission.permissionKey,
          name: orgPermission.name,
          description: orgPermission.description,
          category: orgPermission.category,
          module: module || orgPermission.module,
          action: action || orgPermission.action,
          enabled: true,
        });
        await rolePermissionRepository.save(rolePermission);
      }
    }

    console.log(`✅ Created Organization Admin role with ${orgPermissions.length} permissions`);
    return adminRole;
  }

  private async createOrganizationUserRole(queryRunner: any, organizationId: string): Promise<Role> {
    const roleRepository = queryRunner.manager.getRepository(Role);
    const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);

    let userRole = await roleRepository.findOne({
      where: { name: 'Organization User', organizationId }
    });

    if (!userRole) {
      userRole = roleRepository.create({
        name: 'Organization User',
        description: 'Limited access to organization features',
        organizationId,
        isActive: true,
      });
      userRole = await roleRepository.save(userRole);
    }

    // Define basic permissions for organization users
    const basicPermissions = [
      'dashboard.read',
      'events.read',
      'bookings.read',
      'bookings.create',
      'inventory.read',
      'documents.read',
    ];

    // Create role permissions for basic permissions
    for (const permissionKey of basicPermissions) {
      const existingRolePermission = await rolePermissionRepository.findOne({
        where: { 
          roleId: userRole.id, 
          permissionKey 
        }
      });

      if (!existingRolePermission) {
        // Get the permission details from master permissions
        const masterPermissionRepository = queryRunner.manager.getRepository(MasterPermission);
        const masterPermission = await masterPermissionRepository.findOne({
          where: { key: permissionKey }
        });

        if (masterPermission) {
          // Extract module and action from permission key (e.g., "dashboard.view" -> module: "dashboard", action: "view")
          const [module, action] = masterPermission.key.split('.');

          const rolePermission = rolePermissionRepository.create({
            organizationId,
            roleId: userRole.id,
            permissionKey: masterPermission.key,
            name: masterPermission.name,
            description: masterPermission.description,
            category: masterPermission.category,
            module: module || masterPermission.module,
            action: action || masterPermission.action,
            enabled: true,
          });
          await rolePermissionRepository.save(rolePermission);
        }
      }
    }

    console.log(`✅ Created Organization User role with ${basicPermissions.length} permissions`);
    return userRole;
  }

  private async createOrganizationAdminUser(queryRunner: any, organizationId: string, adminRole: Role): Promise<User> {
    const userRepository = queryRunner.manager.getRepository(User);
    
    const adminEmail = 'admin@testorg.com';
    const adminPassword = 'admin123';

    let adminUser = await userRepository.findOne({
      where: { email: adminEmail },
      relations: ['roles']
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      adminUser = userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Organization',
        lastName: 'Admin',
        userType: UserType.ORGANIZATION_ADMIN,
        organizationId,
        isActive: true,
        isVerified: true,
        roles: [adminRole],
      });
      
      adminUser = await userRepository.save(adminUser);
      
      console.log(`✅ Organization admin user created with email: ${adminEmail}`);
      console.log(`🔑 Organization admin password: ${adminPassword}`);
    } else {
      // Ensure admin has the admin role
      if (!adminUser.roles.some(role => role.id === adminRole.id)) {
        adminUser.roles.push(adminRole);
        adminUser = await userRepository.save(adminUser);
      }
    }

    return adminUser;
  }

  private async createOrganizationUser(queryRunner: any, organizationId: string, userRole: Role): Promise<User> {
    const userRepository = queryRunner.manager.getRepository(User);
    
    const userEmail = 'user@testorg.com';
    const userPassword = 'user123';

    let orgUser = await userRepository.findOne({
      where: { email: userEmail },
      relations: ['roles']
    });

    if (!orgUser) {
      const hashedPassword = await bcrypt.hash(userPassword, 12);
      
      orgUser = userRepository.create({
        email: userEmail,
        password: hashedPassword,
        firstName: 'Organization',
        lastName: 'User',
        userType: UserType.ORGANIZATION_USER,
        organizationId,
        isActive: true,
        isVerified: true,
        roles: [userRole],
      });
      
      orgUser = await userRepository.save(orgUser);
      
      console.log(`✅ Organization user created with email: ${userEmail}`);
      console.log(`🔑 Organization user password: ${userPassword}`);
    } else {
      // Ensure user has the user role
      if (!orgUser.roles.some(role => role.id === userRole.id)) {
        orgUser.roles.push(userRole);
        orgUser = await userRepository.save(orgUser);
      }
    }

    return orgUser;
  }
}
