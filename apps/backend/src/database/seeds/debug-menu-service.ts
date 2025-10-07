import { DataSource } from 'typeorm';
import { 
  User, 
  OrganizationPackage
} from '../entities';

export async function debugMenuService(dataSource: DataSource): Promise<void> {
  console.log('🔍 Starting Menu Service debug...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    const userRepository = queryRunner.manager.getRepository(User);
    const organizationPackageRepository = queryRunner.manager.getRepository(OrganizationPackage);

    // Find Ra user
    const raUser = await userRepository.findOne({
      where: { id: '293fb000-6781-44d9-bbb1-79ecdd2d0daf' }
    });

    if (!raUser) {
      console.log('❌ Ra user not found');
      return;
    }

    console.log(`✅ Found Ra user: ${raUser.firstName} ${raUser.lastName}`);
    console.log(`📍 Organization ID: ${raUser.organizationId}`);

    // Test getOrganizationFeatures logic
    console.log('\n🧪 TESTING getOrganizationFeatures LOGIC:');
    
    const packages = await organizationPackageRepository.find({
      where: { organizationId: raUser.organizationId, isActive: true },
      relations: ['featurePackage'],
    });

    console.log(`📦 Found packages: ${packages.length}`);

    const features = new Set<string>();
    for (const pkg of packages) {
      console.log(`\n📋 Package: ${pkg.featurePackage?.name}`);
      console.log(`  - Is Active: ${pkg.featurePackage?.isActive}`);
      console.log(`  - Is Expired: ${pkg.isExpired()}`);
      
      if (pkg.featurePackage?.isActive && !pkg.isExpired()) {
        console.log(`  - Features: ${pkg.featurePackage.features.length}`);
        pkg.featurePackage.features.forEach(feature => {
          features.add(feature);
          console.log(`    Adding feature: ${feature}`);
        });
      }
    }

    const organizationFeatures = Array.from(features);
    console.log(`\n🎯 Final organization features: ${organizationFeatures.length}`);
    console.log(`Features: ${organizationFeatures.join(', ')}`);

    // Test menu filtering logic
    console.log('\n🔍 TESTING MENU FILTERING:');
    
    const testMenuItems = [
      { name: 'Dashboard', feature: undefined },
      { name: 'Booking Management', feature: 'bookings' },
      { name: 'Payment Management', feature: 'payments' },
      { name: 'Event Management', feature: 'events' },
      { name: 'Inventory Management', feature: 'inventory' },
    ];

    for (const item of testMenuItems) {
      if (!item.feature) {
        console.log(`✅ ${item.name}: Always shown (no feature requirement)`);
        continue;
      }

      const hasFeaturePermissions = organizationFeatures.some(feature =>
        feature.startsWith(item.feature + '.')
      );
      
      const matchingFeatures = organizationFeatures.filter(feature =>
        feature.startsWith(item.feature + '.')
      );

      console.log(`${hasFeaturePermissions ? '✅' : '❌'} ${item.name} (feature: ${item.feature})`);
      console.log(`  Matching features: ${matchingFeatures.join(', ') || 'None'}`);
    }

  } catch (error) {
    console.error('❌ Error debugging menu service:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
