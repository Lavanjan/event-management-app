import { DataSource } from 'typeorm';
import { OrganizationPackage, FeaturePackage } from '../entities';

export async function debugPackagePermissions(dataSource: DataSource, organizationId: string) {
  console.log('\n=== DEBUG: Organization Package Permissions ===');

  const organizationPackageRepository = dataSource.getRepository(OrganizationPackage);
  const featurePackageRepository = dataSource.getRepository(FeaturePackage);

  console.log(`\n1. Checking organization packages for organization (${organizationId}):`);
  const orgPackages = await organizationPackageRepository.find({
    where: { organizationId, isActive: true },
    relations: ['featurePackage'],
  });

  console.log(`Found ${orgPackages.length} organization packages:`);
  for (const orgPackage of orgPackages) {
    console.log(`- Package: ${orgPackage.featurePackage?.name} (ID: ${orgPackage.featurePackageId})`);
  }

  console.log(`\n2. Checking feature package permissions:`);
  for (const orgPackage of orgPackages) {
    const featurePackage = await featurePackageRepository.findOne({
      where: { id: orgPackage.featurePackageId },
    });

    if (featurePackage) {
      console.log(`\nFeature Package: ${featurePackage.name}`);
      console.log(`Features count: ${featurePackage.features?.length || 0}`);

      if (featurePackage.features) {
        for (const feature of featurePackage.features) {
          console.log(`  - ${feature}`);
        }
      }
    }
  }

  console.log('\n=== END DEBUG ===\n');
}
