const { DataSource } = require('typeorm');
const { MasterPermission } = require('./apps/backend/dist/database/entities/master-permission.entity');
const { OrganizationPermission } = require('./apps/backend/dist/database/entities/organization-permission.entity');
const { Organization } = require('./apps/backend/dist/database/entities/organization.entity');

// Database configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'admin',
  database: 'event_booking',
  entities: [
    './apps/backend/dist/database/entities/*.entity.js'
  ],
  synchronize: false,
  logging: false,
});

async function syncOrganizationPermissions() {
  try {
    console.log('🔄 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Get all organizations
    const organizationRepo = dataSource.getRepository(Organization);
    const organizations = await organizationRepo.find();
    console.log(`📋 Found ${organizations.length} organizations`);

    // Get all master permissions
    const masterPermissionRepo = dataSource.getRepository(MasterPermission);
    const masterPermissions = await masterPermissionRepo.find();
    console.log(`🔑 Found ${masterPermissions.length} master permissions`);

    const orgPermissionRepo = dataSource.getRepository(OrganizationPermission);

    for (const org of organizations) {
      console.log(`\n🏢 Processing organization: ${org.name} (${org.id})`);

      // Get existing organization permissions
      const existingPermissions = await orgPermissionRepo.find({
        where: { organizationId: org.id },
      });

      console.log(`   📝 Existing permissions: ${existingPermissions.length}`);

      // Create a map of existing permissions by key
      const existingMap = new Map(existingPermissions.map(p => [p.permissionKey, p]));

      // Prepare permissions to upsert
      const permissionsToUpsert = masterPermissions.map(masterPerm => {
        const existing = existingMap.get(masterPerm.key);
        
        const orgPermission = new OrganizationPermission();
        orgPermission.organizationId = org.id;
        orgPermission.permissionKey = masterPerm.key;
        orgPermission.name = masterPerm.name;
        orgPermission.description = masterPerm.description;
        orgPermission.category = masterPerm.category;
        // Keep existing enabled state, or use master default (true)
        orgPermission.enabled = existing ? existing.enabled : masterPerm.defaultEnabled;
        
        return orgPermission;
      });

      // Use transaction to ensure consistency
      await dataSource.transaction(async manager => {
        const permissionRepo = manager.getRepository(OrganizationPermission);
        
        // Delete existing permissions
        await permissionRepo.delete({ organizationId: org.id });
        console.log(`   🗑️  Deleted existing permissions`);
        
        // Insert updated permissions
        await permissionRepo.save(permissionsToUpsert);
        console.log(`   ✅ Inserted ${permissionsToUpsert.length} permissions`);
      });

      console.log(`   🎉 Organization ${org.name} permissions synced successfully`);
    }

    console.log('\n🎯 All organizations synced successfully!');

    // Verify the sync by checking one organization
    if (organizations.length > 0) {
      const firstOrg = organizations[0];
      const syncedPermissions = await orgPermissionRepo.find({
        where: { organizationId: firstOrg.id },
        order: { category: 'ASC', name: 'ASC' },
      });

      console.log(`\n📊 Verification for ${firstOrg.name}:`);
      console.log(`   Total permissions: ${syncedPermissions.length}`);
      
      // Group by category
      const byCategory = syncedPermissions.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
      }, {});

      Object.keys(byCategory).forEach(category => {
        const enabled = byCategory[category].filter(p => p.enabled).length;
        const total = byCategory[category].length;
        console.log(`   ${category}: ${enabled}/${total} enabled`);
      });
    }

  } catch (error) {
    console.error('❌ Error syncing organization permissions:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the sync
syncOrganizationPermissions();
