import { DataSource } from 'typeorm';
import { 
  User, 
  Role, 
  RolePermission, 
  OrganizationPackage, 
  MasterPermission,
  Organization
} from '../entities';

export async function debugRaPermissions(dataSource: DataSource): Promise<void> {
  console.log('🔍 Starting Ra organization permissions debug...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

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
    console.log(`👤 User Type: ${raUser.userType}`);

    // 1. Check organization packages
    console.log('\n📦 ORGANIZATION PACKAGES:');
    const orgPackages = await organizationPackageRepository.find({
      where: { organizationId: raUser.organizationId, isActive: true },
      relations: ['featurePackage']
    });

    console.log(`Active packages: ${orgPackages.length}`);
    for (const pkg of orgPackages) {
      console.log(`  - ${pkg.featurePackage.name}:`);
      console.log(`    Features (${pkg.featurePackage.features.length}): ${pkg.featurePackage.features.join(', ')}`);
      console.log(`    Is Active: ${pkg.featurePackage.isActive}`);
      console.log(`    Expires: ${pkg.expiresAt || 'Never'}`);
    }

    // 2. Check user roles
    console.log('\n👑 USER ROLES:');
    const userRoles = await roleRepository.find({
      where: { organizationId: raUser.organizationId },
      relations: ['users']
    });

    console.log(`Total roles in organization: ${userRoles.length}`);
    for (const role of userRoles) {
      const isUserInRole = role.users?.some(u => u.id === raUser.id);
      console.log(`  - ${role.name} (${role.id}): ${isUserInRole ? '✅ USER IS IN THIS ROLE' : '❌ User not in role'}`);
    }

    // 3. Check role permissions for admin role
    console.log('\n🔑 ROLE PERMISSIONS:');
    const adminRole = await roleRepository.findOne({
      where: { name: 'Organization Admin', organizationId: raUser.organizationId }
    });

    if (adminRole) {
      const rolePermissions = await rolePermissionRepository.find({
        where: { roleId: adminRole.id, enabled: true }
      });

      console.log(`Admin role permissions: ${rolePermissions.length}`);
      
      // Group by module
      const permissionsByModule = rolePermissions.reduce((acc, rp) => {
        if (!acc[rp.module]) acc[rp.module] = [];
        acc[rp.module].push(rp.action);
        return acc;
      }, {} as Record<string, string[]>);

      for (const [module, actions] of Object.entries(permissionsByModule)) {
        console.log(`  ${module}: ${actions.join(', ')}`);
      }

      // Check specific booking permissions
      const bookingPermissions = rolePermissions.filter(rp => rp.module === 'bookings');
      console.log(`\n🎫 Booking permissions: ${bookingPermissions.length}`);
      bookingPermissions.forEach(bp => {
        console.log(`  - ${bp.permissionKey}: ${bp.name}`);
      });
    }

    // 4. Test the permission service logic
    console.log('\n🧪 TESTING PERMISSION SERVICE LOGIC:');
    
    // Simulate getOrganizationPackageFeatures
    const allFeatures = new Set<string>();
    for (const pkg of orgPackages) {
      if (pkg.featurePackage?.isActive && !pkg.isExpired()) {
        pkg.featurePackage.features.forEach(feature => allFeatures.add(feature));
      }
    }
    console.log(`Package features: ${Array.from(allFeatures).join(', ')}`);

    // Simulate getUserRolePermissions
    const rolePermissionQuery = await rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoin('user_roles', 'ur', 'ur.role_id = rp.role_id')
      .innerJoin('roles', 'r', 'r.id = rp.role_id')
      .innerJoin('users', 'u', 'u.id = ur.user_id')
      .where('u.id = :userId', { userId: raUser.id })
      .andWhere('u.organization_id = :organizationId', { organizationId: raUser.organizationId })
      .andWhere('rp.organization_id = :organizationId', { organizationId: raUser.organizationId })
      .andWhere('rp.enabled = true')
      .andWhere('rp.deleted_at IS NULL')
      .andWhere('r.is_active = true')
      .select('rp.permission_key')
      .getRawMany();

    const rolePermissionKeys = rolePermissionQuery.map(r => r.permission_key);
    console.log(`Role permissions from query: ${rolePermissionKeys.length}`);
    console.log(`Role permissions: ${rolePermissionKeys.join(', ')}`);

    // Simulate calculateFinalPermissions
    const basePermissions = new Set(Array.from(allFeatures));
    const roleAllowed = new Set(rolePermissionKeys);
    const allowedByRole = Array.from(basePermissions).filter(p => roleAllowed.has(p));
    
    console.log(`\n🎯 FINAL CALCULATION:`);
    console.log(`Base permissions from packages: ${Array.from(basePermissions).length}`);
    console.log(`Role permissions: ${rolePermissionKeys.length}`);
    console.log(`Final allowed permissions: ${allowedByRole.length}`);
    console.log(`Final permissions: ${allowedByRole.join(', ')}`);

    // Check specific modules
    const bookingFinalPerms = allowedByRole.filter(p => p.startsWith('bookings.'));
    const paymentFinalPerms = allowedByRole.filter(p => p.startsWith('payments.'));
    const eventFinalPerms = allowedByRole.filter(p => p.startsWith('events.'));
    
    console.log(`\n📊 BY MODULE:`);
    console.log(`Booking permissions: ${bookingFinalPerms.length} - ${bookingFinalPerms.join(', ')}`);
    console.log(`Payment permissions: ${paymentFinalPerms.length} - ${paymentFinalPerms.join(', ')}`);
    console.log(`Event permissions: ${eventFinalPerms.length} - ${eventFinalPerms.join(', ')}`);

    // Check which permissions from package are missing in master_permissions
    console.log(`\n🔍 CHECKING MISSING MASTER PERMISSIONS:`);
    const allMasterPermissions = await masterPermissionRepository.find();
    const masterPermissionKeys = allMasterPermissions.map(mp => mp.key);

    const packageFeaturesList = Array.from(allFeatures);
    const missingInMaster = packageFeaturesList.filter(feature => !masterPermissionKeys.includes(feature));

    console.log(`Package features: ${packageFeaturesList.length}`);
    console.log(`Master permissions: ${masterPermissionKeys.length}`);
    console.log(`Missing in master_permissions: ${missingInMaster.length}`);
    if (missingInMaster.length > 0) {
      console.log(`Missing permissions: ${missingInMaster.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error debugging Ra permissions:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
