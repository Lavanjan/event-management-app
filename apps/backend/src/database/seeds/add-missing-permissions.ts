import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { RolePermission, MasterPermission, OrganizationPermission } from '../entities';

async function addMissingPermissions() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    const rolePermissionRepository = dataSource.getRepository(RolePermission);
    const masterPermissionRepository = dataSource.getRepository(MasterPermission);
    const organizationPermissionRepository = dataSource.getRepository(OrganizationPermission);
    
    const userOrgId = '92c8966d-a30e-4dd3-9e22-e0ba7ee20991';
    const userRoleId = '4a2b4146-c89b-439a-b598-175a8d73ed06';
    
    // Missing permissions that need to be added
    const missingPermissions = [
      'payments.read',
      'payments.create',
      'payments.update',
      'payments.process',
      'payments.refund',
      'roles.read',
      'roles.create',
      'roles.update',
      'roles.delete',
    ];
    
    console.log(`🔧 Adding missing permissions for organization: ${userOrgId}`);
    console.log(`🔧 User role: ${userRoleId}`);
    
    for (const permissionKey of missingPermissions) {
      // Check if master permission exists
      const masterPermission = await masterPermissionRepository.findOne({
        where: { key: permissionKey }
      });
      
      if (!masterPermission) {
        console.log(`⚠️  Master permission not found: ${permissionKey}, skipping...`);
        continue;
      }
      
      // Check if organization permission exists
      let orgPermission = await organizationPermissionRepository.findOne({
        where: { 
          organizationId: userOrgId, 
          permissionKey: permissionKey 
        }
      });

      if (!orgPermission) {
        // Create organization permission
        orgPermission = organizationPermissionRepository.create({
          organizationId: userOrgId,
          permissionKey: permissionKey,
          name: masterPermission.name,
          description: masterPermission.description,
          category: masterPermission.category,
          enabled: masterPermission.defaultEnabled,
        });
        await organizationPermissionRepository.save(orgPermission);
        console.log(`✅ Created organization permission: ${permissionKey}`);
      }
      
      // Check if role permission exists
      const existingRolePermission = await rolePermissionRepository.findOne({
        where: { 
          roleId: userRoleId, 
          permissionKey: permissionKey 
        }
      });

      if (!existingRolePermission && orgPermission.enabled) {
        // Extract module and action from permission key
        const [module, action] = permissionKey.split('.');
        
        const rolePermission = rolePermissionRepository.create({
          organizationId: userOrgId,
          roleId: userRoleId,
          permissionKey: permissionKey,
          name: masterPermission.name,
          description: masterPermission.description,
          category: masterPermission.category,
          module: module,
          action: action,
          enabled: true,
        });
        await rolePermissionRepository.save(rolePermission);
        console.log(`✅ Created role permission: ${permissionKey}`);
      } else if (existingRolePermission) {
        console.log(`⏭️  Role permission already exists: ${permissionKey}`);
      } else {
        console.log(`⚠️  Organization permission disabled: ${permissionKey}`);
      }
    }
    
    // Verify the final count
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
      .where('u.id = :userId', { userId: '293fb000-6781-44d9-bbb1-79ecdd2d0daf' })
      .andWhere('u.organization_id = :organizationId', { organizationId: userOrgId })
      .andWhere('rp.organization_id = :organizationId', { organizationId: userOrgId })
      .andWhere('rp.enabled = true')
      .andWhere('rp.deleted_at IS NULL')
      .andWhere('r.is_active = true')
      .select('rp.permission_key')
      .getRawMany();

    console.log(`🧪 Permission service query result: ${testResult.length} permissions`);
    const permissionKeys = testResult.map(r => r.permission_key).sort();
    console.log(`📋 All permissions: ${permissionKeys.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error adding missing permissions:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

addMissingPermissions();
