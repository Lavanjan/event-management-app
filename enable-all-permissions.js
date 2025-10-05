const { DataSource } = require('typeorm');
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

async function enableAllPermissions() {
  try {
    console.log('🔄 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Get all organizations
    const organizationRepo = dataSource.getRepository(Organization);
    const organizations = await organizationRepo.find();
    console.log(`📋 Found ${organizations.length} organizations`);

    const orgPermissionRepo = dataSource.getRepository(OrganizationPermission);

    for (const org of organizations) {
      console.log(`\n🏢 Processing organization: ${org.name} (${org.id})`);

      // Update all permissions to enabled = true
      const result = await orgPermissionRepo.update(
        { organizationId: org.id },
        { enabled: true }
      );

      console.log(`   ✅ Enabled ${result.affected} permissions`);
    }

    console.log('\n🎯 All permissions enabled for all organizations!');

    // Verify the changes
    if (organizations.length > 0) {
      const firstOrg = organizations[0];
      const allPermissions = await orgPermissionRepo.find({
        where: { organizationId: firstOrg.id },
        order: { category: 'ASC', name: 'ASC' },
      });

      const enabledCount = allPermissions.filter(p => p.enabled).length;
      console.log(`\n📊 Verification for ${firstOrg.name}:`);
      console.log(`   Total permissions: ${allPermissions.length}`);
      console.log(`   Enabled permissions: ${enabledCount}`);
      
      // Group by category
      const byCategory = allPermissions.reduce((acc, perm) => {
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
    console.error('❌ Error enabling permissions:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
enableAllPermissions();
