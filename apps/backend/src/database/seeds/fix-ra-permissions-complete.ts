import { DataSource, In } from 'typeorm';
import { 
  User, 
  Role, 
  RolePermission, 
  OrganizationPackage, 
  MasterPermission,
  Organization
} from '../entities';

export async function fixRaPermissionsComplete(dataSource: DataSource): Promise<void> {
  console.log('🔧 Starting COMPLETE Ra organization permissions fix...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userRepository = queryRunner.manager.getRepository(User);
    const roleRepository = queryRunner.manager.getRepository(Role);
    const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);
    const organizationPackageRepository = queryRunner.manager.getRepository(OrganizationPackage);
    const masterPermissionRepository = queryRunner.manager.getRepository(MasterPermission);

    // Find Ra user
    const raUser = await userRepository.findOne({
      where: { id: '293fb000-6781-44d9-bbb1-79ecdd2d0daf' }
    });

    if (!raUser) {
      console.log('❌ Ra user not found');
      return;
    }

    console.log(`✅ Found Ra user: ${raUser.firstName} ${raUser.lastName}`);

    // Get organization's feature packages
    const orgPackages = await organizationPackageRepository.find({
      where: { organizationId: raUser.organizationId, isActive: true },
      relations: ['featurePackage'],
    });

    console.log(`📦 Active packages: ${orgPackages.length}`);
    
    // Collect ALL permissions from feature packages
    const permissionKeys = new Set<string>();
    for (const pkg of orgPackages) {
      if (pkg.featurePackage?.isActive && !pkg.isExpired()) {
        console.log(`  - ${pkg.featurePackage.name}: ${pkg.featurePackage.features.length} features`);
        pkg.featurePackage.features.forEach(feature => {
          permissionKeys.add(feature);
          console.log(`    Adding: ${feature}`);
        });
      }
    }

    console.log(`🎯 Total permissions to assign: ${permissionKeys.size}`);

    // Find admin role
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

    // Get ALL master permissions for the permission keys
    const masterPermissions = await masterPermissionRepository.find({
      where: { key: In(Array.from(permissionKeys)) }
    });

    console.log(`📋 Found master permissions: ${masterPermissions.length}`);

    // Check which permissions are missing
    const foundKeys = masterPermissions.map(mp => mp.key);
    const missingKeys = Array.from(permissionKeys).filter(key => !foundKeys.includes(key));
    
    if (missingKeys.length > 0) {
      console.log(`⚠️ Missing master permissions: ${missingKeys.join(', ')}`);
    }

    // Clear existing role permissions
    await rolePermissionRepository.delete({ roleId: adminRole.id });
    console.log('🧹 Cleared existing role permissions');

    // Create role permissions for ALL found master permissions
    const rolePermissions = masterPermissions.map(masterPerm => {
      return rolePermissionRepository.create({
        organizationId: raUser.organizationId,
        roleId: adminRole.id,
        permissionKey: masterPerm.key,
        name: masterPerm.name,
        description: masterPerm.description,
        category: masterPerm.category,
        module: masterPerm.module,
        action: masterPerm.action,
        enabled: true,
        grantedBy: null,
        grantedAt: new Date(),
      });
    });

    if (rolePermissions.length > 0) {
      await rolePermissionRepository.save(rolePermissions);
      console.log(`✅ Created ${rolePermissions.length} role permissions`);
    }

    // Verify by module
    const permissionsByModule = rolePermissions.reduce((acc, rp) => {
      if (!acc[rp.module]) acc[rp.module] = [];
      acc[rp.module].push(rp.action);
      return acc;
    }, {} as Record<string, string[]>);

    console.log(`\n📊 PERMISSIONS BY MODULE:`);
    for (const [module, actions] of Object.entries(permissionsByModule)) {
      console.log(`  ${module}: ${actions.length} permissions - ${actions.join(', ')}`);
    }

    // Specifically check critical modules
    const bookingPerms = rolePermissions.filter(rp => rp.module === 'bookings');
    const paymentPerms = rolePermissions.filter(rp => rp.module === 'payments');
    const financialPerms = rolePermissions.filter(rp => rp.module === 'financial');
    const rolePerms = rolePermissions.filter(rp => rp.module === 'roles');
    const userPerms = rolePermissions.filter(rp => rp.module === 'users');

    console.log(`\n🎯 CRITICAL MODULES:`);
    console.log(`🎫 Booking: ${bookingPerms.length} permissions`);
    console.log(`💳 Payment: ${paymentPerms.length} permissions`);
    console.log(`💰 Financial: ${financialPerms.length} permissions`);
    console.log(`👑 Roles: ${rolePerms.length} permissions`);
    console.log(`👥 Users: ${userPerms.length} permissions`);

    await queryRunner.commitTransaction();
    console.log('🎉 COMPLETE Ra organization permissions fix completed successfully!');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error fixing Ra organization permissions:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
