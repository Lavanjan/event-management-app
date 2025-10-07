import { DataSource, In } from 'typeorm';
import {
  User,
  Role,
  RolePermission,
  OrganizationPackage,
  MasterPermission,
  Organization
} from '../entities';

export async function fixRaOrganizationPermissions(dataSource: DataSource): Promise<void> {
  console.log('🔧 Starting Ra organization permissions fix...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userRepository = queryRunner.manager.getRepository(User);
    const roleRepository = queryRunner.manager.getRepository(Role);
    const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
    const organizationPackageRepository = queryRunner.manager.getRepository(OrganizationPackage);
    const masterPermissionRepository = queryRunner.manager.getRepository(MasterPermission);
    const organizationRepository = queryRunner.manager.getRepository(Organization);

    // Find Ra user
    const raUser = await userRepository.findOne({
      where: { id: '293fb000-6781-44d9-bbb1-79ecdd2d0daf' },
      relations: ['roles']
    });

    if (!raUser) {
      console.log('❌ Ra user not found');
      return;
    }

    console.log(`✅ Found Ra user: ${raUser.firstName} ${raUser.lastName} (${raUser.email})`);
    console.log(`📍 Organization ID: ${raUser.organizationId}`);

    // Find Ra organization
    const raOrganization = await organizationRepository.findOne({
      where: { id: raUser.organizationId }
    });

    if (!raOrganization) {
      console.log('❌ Ra organization not found');
      return;
    }

    console.log(`🏢 Organization: ${raOrganization.name}`);

    // Check organization's feature packages
    const orgPackages = await organizationPackageRepository.find({
      where: { organizationId: raUser.organizationId, isActive: true },
      relations: ['featurePackage']
    });

    console.log(`📦 Active packages: ${orgPackages.length}`);
    for (const pkg of orgPackages) {
      console.log(`  - ${pkg.featurePackage.name}: ${pkg.featurePackage.features.length} features`);
      console.log(`    Features: ${pkg.featurePackage.features.slice(0, 5).join(', ')}${pkg.featurePackage.features.length > 5 ? '...' : ''}`);
    }

    // Find Ra's organization admin role
    const adminRole = await roleRepository.findOne({
      where: { 
        name: 'Organization Admin', 
        organizationId: raUser.organizationId 
      }
    });

    if (!adminRole) {
      console.log('❌ Organization Admin role not found');
      return;
    }

    console.log(`👑 Found admin role: ${adminRole.name} (${adminRole.id})`);

    // Check current role permissions
    const currentRolePermissions = await rolePermissionRepository.find({
      where: { roleId: adminRole.id, enabled: true }
    });

    console.log(`🔑 Current role permissions: ${currentRolePermissions.length}`);

    // Collect all permissions from feature packages
    const permissionKeys = new Set<string>();
    for (const pkg of orgPackages) {
      if (pkg.featurePackage?.isActive && !pkg.isExpired()) {
        pkg.featurePackage.features.forEach(feature => permissionKeys.add(feature));
      }
    }

    console.log(`🎯 Total permissions from packages: ${permissionKeys.size}`);

    // Get master permission details
    const masterPermissions = await masterPermissionRepository.find({
      where: { key: In(Array.from(permissionKeys)) }
    });

    console.log(`📋 Found master permissions: ${masterPermissions.length}`);

    // Clear existing role permissions
    await rolePermissionRepository.delete({ roleId: adminRole.id });
    console.log('🧹 Cleared existing role permissions');

    // Create new role permissions
    const rolePermissions = Array.from(permissionKeys).map(key => {
      const masterPerm = masterPermissions.find(mp => mp.key === key);
      if (!masterPerm) {
        console.warn(`⚠️ Master permission not found for key: ${key}`);
        return null;
      }

      return rolePermissionRepository.create({
        organizationId: raUser.organizationId,
        roleId: adminRole.id,
        permissionKey: key,
        name: masterPerm.name,
        description: masterPerm.description,
        category: masterPerm.category,
        module: masterPerm.module,
        action: masterPerm.action,
        enabled: true,
        grantedBy: null,
        grantedAt: new Date(),
      });
    }).filter(Boolean);

    if (rolePermissions.length > 0) {
      await rolePermissionRepository.save(rolePermissions);
      console.log(`✅ Created ${rolePermissions.length} role permissions`);
    }

    // Verify booking permissions specifically
    const bookingPermissions = rolePermissions.filter(rp => rp.permissionKey.startsWith('bookings.'));
    console.log(`🎫 Booking permissions: ${bookingPermissions.length}`);
    bookingPermissions.forEach(bp => {
      console.log(`  - ${bp.permissionKey}: ${bp.name}`);
    });

    await queryRunner.commitTransaction();
    console.log('🎉 Ra organization permissions fix completed successfully!');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error fixing Ra organization permissions:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// Helper function to check if package is expired
declare module '../entities/organization-package.entity' {
  interface OrganizationPackage {
    isExpired(): boolean;
  }
}
