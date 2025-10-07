import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User, Role, RolePermission } from '../entities';

async function debugPermissions() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);
    const rolePermissionRepository = dataSource.getRepository(RolePermission);
    
    // Find the existing user
    const existingUserId = '293fb000-6781-44d9-bbb1-79ecdd2d0daf';
    
    const existingUser = await userRepository.findOne({
      where: { id: existingUserId },
      relations: ['roles', 'roles.rolePermissions']
    });
    
    if (!existingUser) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${existingUser.email}`);
    console.log(`   User ID: ${existingUser.id}`);
    console.log(`   Organization ID: ${existingUser.organizationId}`);
    console.log(`   User Type: ${existingUser.userType}`);
    console.log(`   Roles: ${existingUser.roles.length}`);
    
    for (const role of existingUser.roles) {
      console.log(`   Role: ${role.name} (ID: ${role.id})`);
      console.log(`   Role Organization ID: ${role.organizationId}`);
      console.log(`   Role Permissions: ${role.rolePermissions?.length || 0}`);
      
      if (role.rolePermissions) {
        for (const rp of role.rolePermissions) {
          console.log(`     - ${rp.permissionKey} (${rp.module}.${rp.action})`);
        }
      }
    }
    
    // Check role permissions directly
    console.log('\n🔍 Checking role permissions directly...');
    const rolePermissions = await rolePermissionRepository.find({
      where: { 
        organizationId: existingUser.organizationId,
        enabled: true 
      }
    });
    
    console.log(`Found ${rolePermissions.length} role permissions for organization`);
    for (const rp of rolePermissions) {
      console.log(`  - ${rp.permissionKey} (Role: ${rp.roleId})`);
    }
    
    // Test the exact query from EnhancedPermissionCheckService
    console.log('\n🔍 Testing exact query from EnhancedPermissionCheckService...');
    const result = await rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoin('user_roles', 'ur', 'ur.role_id = rp.role_id')
      .innerJoin('roles', 'r', 'r.id = rp.role_id')
      .innerJoin('users', 'u', 'u.id = ur.user_id')
      .where('u.id = :userId', { userId: existingUserId })
      .andWhere('u.organization_id = :organizationId', { organizationId: existingUser.organizationId })
      .andWhere('rp.organization_id = :organizationId', { organizationId: existingUser.organizationId })
      .andWhere('rp.enabled = true')
      .andWhere('rp.deleted_at IS NULL')
      .andWhere('r.is_active = true')
      .select('rp.permission_key')
      .getRawMany();

    console.log(`Query result: ${result.length} permissions`);
    for (const r of result) {
      console.log(`  - ${r.permission_key}`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging permissions:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

debugPermissions();
