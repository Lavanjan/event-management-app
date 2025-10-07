import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User, Role, RolePermission, OrganizationPermission, MasterPermission } from '../entities';

async function fixUserPermissions() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);
    const rolePermissionRepository = dataSource.getRepository(RolePermission);
    const organizationPermissionRepository = dataSource.getRepository(OrganizationPermission);
    const masterPermissionRepository = dataSource.getRepository(MasterPermission);
    
    // Find the existing user
    const existingUserId = '293fb000-6781-44d9-bbb1-79ecdd2d0daf';
    const userOrgId = '92c8966d-a30e-4dd3-9e22-e0ba7ee20991';
    const userRoleId = '4a2b4146-c89b-439a-b598-175a8d73ed06';
    
    console.log(`🔧 Fixing permissions for user organization: ${userOrgId}`);
    console.log(`🔧 User role: ${userRoleId}`);
    
    // 1. First, sync organization permissions with master permissions
    const masterPermissions = await masterPermissionRepository.find();
    console.log(`📋 Found ${masterPermissions.length} master permissions`);
    
    for (const masterPermission of masterPermissions) {
      const existingOrgPermission = await organizationPermissionRepository.findOne({
        where: { 
          organizationId: userOrgId, 
          permissionKey: masterPermission.key 
        }
      });

      if (!existingOrgPermission) {
        const orgPermission = organizationPermissionRepository.create({
          organizationId: userOrgId,
          permissionKey: masterPermission.key,
          name: masterPermission.name,
          description: masterPermission.description,
          category: masterPermission.category,
          enabled: masterPermission.defaultEnabled,
        });
        await organizationPermissionRepository.save(orgPermission);
        console.log(`✅ Created organization permission: ${masterPermission.key}`);
      }
    }
    
    // 2. Get all enabled organization permissions for the user's organization
    const orgPermissions = await organizationPermissionRepository.find({
      where: { organizationId: userOrgId, enabled: true }
    });
    
    console.log(`📋 Found ${orgPermissions.length} enabled organization permissions`);
    
    // 3. Create role permissions for the user's role
    for (const orgPermission of orgPermissions) {
      const existingRolePermission = await rolePermissionRepository.findOne({
        where: { 
          roleId: userRoleId, 
          permissionKey: orgPermission.permissionKey 
        }
      });

      if (!existingRolePermission) {
        // Extract module and action from permission key
        const [module, action] = orgPermission.permissionKey.split('.');
        
        const rolePermission = rolePermissionRepository.create({
          organizationId: userOrgId,
          roleId: userRoleId,
          permissionKey: orgPermission.permissionKey,
          name: orgPermission.name,
          description: orgPermission.description,
          category: orgPermission.category,
          module: module,
          action: action,
          enabled: true,
        });
        await rolePermissionRepository.save(rolePermission);
        console.log(`✅ Created role permission: ${orgPermission.permissionKey}`);
      }
    }
    
    // 4. Verify the fix
    const finalRolePermissions = await rolePermissionRepository.find({
      where: { roleId: userRoleId }
    });
    
    console.log(`🎉 Final result: User's role now has ${finalRolePermissions.length} permissions`);
    
    // Test the query that the permission service uses
    const testResult = await rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoin('user_roles', 'ur', 'ur.role_id = rp.role_id')
      .innerJoin('roles', 'r', 'r.id = rp.role_id')
      .innerJoin('users', 'u', 'u.id = ur.user_id')
      .where('u.id = :userId', { userId: existingUserId })
      .andWhere('u.organization_id = :organizationId', { organizationId: userOrgId })
      .andWhere('rp.organization_id = :organizationId', { organizationId: userOrgId })
      .andWhere('rp.enabled = true')
      .andWhere('rp.deleted_at IS NULL')
      .andWhere('r.is_active = true')
      .select('rp.permission_key')
      .getRawMany();

    console.log(`🧪 Permission service query result: ${testResult.length} permissions`);
    for (const r of testResult.slice(0, 5)) {
      console.log(`  - ${r.permission_key}`);
    }
    if (testResult.length > 5) {
      console.log(`  ... and ${testResult.length - 5} more`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing user permissions:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

fixUserPermissions();
