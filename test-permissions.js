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

async function testPermissions() {
  try {
    console.log('🔄 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Get the "Ra" organization (the one mentioned in the error)
    const organizationRepo = dataSource.getRepository(Organization);
    const raOrg = await organizationRepo.findOne({
      where: { name: 'Ra' }
    });

    if (!raOrg) {
      console.log('❌ Organization "Ra" not found');
      return;
    }

    console.log(`\n🏢 Testing permissions for organization: ${raOrg.name} (${raOrg.id})`);

    const orgPermissionRepo = dataSource.getRepository(OrganizationPermission);
    
    // Get all permissions for this organization
    const allPermissions = await orgPermissionRepo.find({
      where: { organizationId: raOrg.id },
      order: { category: 'ASC', name: 'ASC' },
    });

    console.log(`📋 Total permissions: ${allPermissions.length}`);

    // Check document permissions specifically
    const documentPermissions = allPermissions.filter(p => p.category === 'Documents');
    console.log(`\n📄 Document permissions:`);
    documentPermissions.forEach(perm => {
      const status = perm.enabled ? '✅' : '❌';
      console.log(`   ${status} ${perm.permissionKey}: ${perm.name} (${perm.enabled ? 'ENABLED' : 'DISABLED'})`);
    });

    // Check if documents.read is enabled
    const documentsRead = documentPermissions.find(p => p.permissionKey === 'documents.read');
    if (documentsRead && documentsRead.enabled) {
      console.log(`\n🎉 documents.read permission is ENABLED for organization "${raOrg.name}"`);
    } else {
      console.log(`\n❌ documents.read permission is DISABLED for organization "${raOrg.name}"`);
    }

    // Show summary by category
    console.log(`\n📊 Permission summary by category:`);
    const byCategory = allPermissions.reduce((acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = { enabled: 0, total: 0 };
      acc[perm.category].total++;
      if (perm.enabled) acc[perm.category].enabled++;
      return acc;
    }, {});

    Object.keys(byCategory).forEach(category => {
      const { enabled, total } = byCategory[category];
      const status = enabled === total ? '✅' : enabled > 0 ? '⚠️' : '❌';
      console.log(`   ${status} ${category}: ${enabled}/${total} enabled`);
    });

  } catch (error) {
    console.error('❌ Error testing permissions:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testPermissions();
