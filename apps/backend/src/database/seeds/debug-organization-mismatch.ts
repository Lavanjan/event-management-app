import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User, Role, RolePermission, Organization } from '../entities';

async function debugOrganizationMismatch() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);
    const rolePermissionRepository = dataSource.getRepository(RolePermission);
    const organizationRepository = dataSource.getRepository(Organization);
    
    // Find the existing user
    const existingUserId = '293fb000-6781-44d9-bbb1-79ecdd2d0daf';
    
    const existingUser = await userRepository.findOne({
      where: { id: existingUserId }
    });
    
    console.log(`✅ User Organization ID: ${existingUser.organizationId}`);
    
    // Check all organizations
    const organizations = await organizationRepository.find();
    console.log(`\n📋 All Organizations:`);
    for (const org of organizations) {
      console.log(`  - ${org.name} (ID: ${org.id})`);
    }
    
    // Check all roles
    const roles = await roleRepository.find();
    console.log(`\n📋 All Roles:`);
    for (const role of roles) {
      console.log(`  - ${role.name} (ID: ${role.id}, Org: ${role.organizationId})`);
    }
    
    // Check all role permissions
    const rolePermissions = await rolePermissionRepository.find();
    console.log(`\n📋 All Role Permissions (${rolePermissions.length} total):`);
    const orgGroups = {};
    for (const rp of rolePermissions) {
      if (!orgGroups[rp.organizationId]) {
        orgGroups[rp.organizationId] = [];
      }
      orgGroups[rp.organizationId].push(rp);
    }
    
    for (const [orgId, permissions] of Object.entries(orgGroups)) {
      const permArray = permissions as RolePermission[];
      console.log(`  Organization ${orgId}: ${permArray.length} permissions`);
      for (const rp of permArray.slice(0, 3)) { // Show first 3
        console.log(`    - ${rp.permissionKey} (Role: ${rp.roleId})`);
      }
      if (permArray.length > 3) {
        console.log(`    ... and ${permArray.length - 3} more`);
      }
    }
    
    // Check if user's role has permissions for a different organization
    const userRole = await roleRepository.findOne({
      where: { id: '4a2b4146-c89b-439a-b598-175a8d73ed06' },
      relations: ['rolePermissions']
    });
    
    if (userRole) {
      console.log(`\n🔍 User's Role Details:`);
      console.log(`  Role: ${userRole.name}`);
      console.log(`  Role Org ID: ${userRole.organizationId}`);
      console.log(`  Role Permissions: ${userRole.rolePermissions?.length || 0}`);
      
      // Check if there are permissions for this role in any organization
      const rolePermissionsForRole = await rolePermissionRepository.find({
        where: { roleId: userRole.id }
      });
      
      console.log(`  Permissions for this role (any org): ${rolePermissionsForRole.length}`);
      for (const rp of rolePermissionsForRole.slice(0, 5)) {
        console.log(`    - ${rp.permissionKey} (Org: ${rp.organizationId})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging organization mismatch:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

debugOrganizationMismatch();
