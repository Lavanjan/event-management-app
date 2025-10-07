import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { FeaturePackage, OrganizationPackage, MasterPermission } from '../entities';

async function setupFeaturePackages() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    const featurePackageRepository = dataSource.getRepository(FeaturePackage);
    const organizationPackageRepository = dataSource.getRepository(OrganizationPackage);
    const masterPermissionRepository = dataSource.getRepository(MasterPermission);
    
    // Get all available permissions
    const allPermissions = await masterPermissionRepository.find();
    const permissionKeys = allPermissions.map(p => p.key);
    
    console.log(`📋 Found ${permissionKeys.length} master permissions`);
    
    // Define feature packages
    const packages = [
      {
        name: 'Basic Event Management',
        description: 'Essential features for basic event management',
        features: [
          'dashboard.view',
          'events.read',
          'events.create',
          'events.update',
          'bookings.read',
          'bookings.create',
          'documents.read',
        ],
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly' as const,
        color: '#3B82F6',
        icon: 'Calendar',
        sortOrder: 1,
      },
      {
        name: 'Professional Event Management',
        description: 'Advanced features for professional event organizers',
        features: [
          'dashboard.view',
          'dashboard.analytics',
          'events.read',
          'events.create',
          'events.update',
          'events.delete',
          'events.publish',
          'bookings.read',
          'bookings.create',
          'bookings.update',
          'bookings.cancel',
          'inventory.read',
          'inventory.create',
          'inventory.update',
          'documents.read',
          'documents.create',
          'documents.update',
          'users.read',
          'settings.read',
          'settings.update',
        ],
        price: 79.99,
        currency: 'USD',
        billingCycle: 'monthly' as const,
        color: '#10B981',
        icon: 'Star',
        sortOrder: 2,
      },
      {
        name: 'Enterprise Event Management',
        description: 'Complete feature set for large organizations',
        features: permissionKeys.filter(key => !key.startsWith('product.')), // All except product admin features
        price: 199.99,
        currency: 'USD',
        billingCycle: 'monthly' as const,
        color: '#8B5CF6',
        icon: 'Crown',
        sortOrder: 3,
      },
      {
        name: 'Inventory Management Add-on',
        description: 'Advanced inventory management features',
        features: [
          'inventory.read',
          'inventory.create',
          'inventory.update',
          'inventory.delete',
        ],
        price: 19.99,
        currency: 'USD',
        billingCycle: 'monthly' as const,
        color: '#F59E0B',
        icon: 'Package',
        sortOrder: 4,
      },
      {
        name: 'Financial Management Add-on',
        description: 'Advanced financial reporting and management',
        features: [
          'financial.read',
          'financial.transactions',
          'financial.payouts',
          'bookings.refund',
        ],
        price: 39.99,
        currency: 'USD',
        billingCycle: 'monthly' as const,
        color: '#EF4444',
        icon: 'DollarSign',
        sortOrder: 5,
      },
      {
        name: 'User Management Add-on',
        description: 'Advanced user and role management',
        features: [
          'users.read',
          'users.create',
          'users.update',
          'users.delete',
          'roles.read',
          'roles.create',
          'roles.update',
          'roles.delete',
        ],
        price: 24.99,
        currency: 'USD',
        billingCycle: 'monthly' as const,
        color: '#6366F1',
        icon: 'Users',
        sortOrder: 6,
      },
    ];
    
    // Create feature packages
    for (const packageData of packages) {
      const existingPackage = await featurePackageRepository.findOne({
        where: { name: packageData.name }
      });
      
      if (!existingPackage) {
        // Filter features to only include valid ones
        const validFeatures = packageData.features.filter(feature => 
          permissionKeys.includes(feature)
        );
        
        if (validFeatures.length !== packageData.features.length) {
          const invalidFeatures = packageData.features.filter(feature => 
            !permissionKeys.includes(feature)
          );
          console.log(`⚠️  Skipping invalid features for ${packageData.name}: ${invalidFeatures.join(', ')}`);
        }
        
        const featurePackage = featurePackageRepository.create({
          ...packageData,
          features: validFeatures,
        });
        
        await featurePackageRepository.save(featurePackage);
        console.log(`✅ Created feature package: ${packageData.name} (${validFeatures.length} features)`);
      } else {
        console.log(`⏭️  Feature package already exists: ${packageData.name}`);
      }
    }
    
    // Assign Enterprise package to existing organization "Ra"
    const raOrgId = '92c8966d-a30e-4dd3-9e22-e0ba7ee20991';
    const enterprisePackage = await featurePackageRepository.findOne({
      where: { name: 'Enterprise Event Management' }
    });
    
    if (enterprisePackage) {
      const existingAssignment = await organizationPackageRepository.findOne({
        where: {
          organizationId: raOrgId,
          featurePackageId: enterprisePackage.id,
          isActive: true
        }
      });
      
      if (!existingAssignment) {
        const orgPackage = organizationPackageRepository.create({
          organizationId: raOrgId,
          featurePackageId: enterprisePackage.id,
          isActive: true,
          assignedAt: new Date(),
          notes: 'Default enterprise package assignment for existing organization',
        });
        
        await organizationPackageRepository.save(orgPackage);
        console.log(`✅ Assigned Enterprise package to organization Ra`);
      } else {
        console.log(`⏭️  Enterprise package already assigned to organization Ra`);
      }
    }
    
    // Summary
    const totalPackages = await featurePackageRepository.count();
    const totalAssignments = await organizationPackageRepository.count({ where: { isActive: true } });
    
    console.log(`\n🎉 Feature package setup complete!`);
    console.log(`📦 Total packages: ${totalPackages}`);
    console.log(`🏢 Total active assignments: ${totalAssignments}`);
    
  } catch (error) {
    console.error('❌ Error setting up feature packages:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

setupFeaturePackages();
