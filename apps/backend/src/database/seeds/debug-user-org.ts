import { DataSource } from 'typeorm';
import { User, Organization, OrganizationPackage } from '../entities';

export async function debugUserOrganization(dataSource: DataSource): Promise<string | null> {
  console.log('\n=== DEBUG: User Organization ===');

  const userRepository = dataSource.getRepository(User);
  const organizationRepository = dataSource.getRepository(Organization);
  const organizationPackageRepository = dataSource.getRepository(OrganizationPackage);

  // Find the user
  const user = await userRepository.findOne({
    where: { email: 'ragvrag08@gmail.com' },
  });

  if (!user) {
    console.log('User not found!');
    return null;
  }

  console.log(`\n1. User Details:`);
  console.log(`- ID: ${user.id}`);
  console.log(`- Email: ${user.email}`);
  console.log(`- User Type: ${user.userType}`);
  console.log(`- Organization ID: ${user.organizationId}`);

  // Get organization details
  if (user.organizationId) {
    const organization = await organizationRepository.findOne({
      where: { id: user.organizationId },
    });
    if (organization) {
      console.log(`- Organization Name: ${organization.name}`);
    }
  }

  console.log(`\n2. Checking organization packages for this organization:`);
  const orgPackages = await organizationPackageRepository.find({
    where: { organizationId: user.organizationId },
    relations: ['featurePackage'],
  });

  console.log(`Found ${orgPackages.length} organization packages:`);
  for (const orgPackage of orgPackages) {
    console.log(`- Package: ${orgPackage.featurePackage?.name} (ID: ${orgPackage.featurePackageId})`);
    console.log(`  Assigned At: ${orgPackage.assignedAt}`);
    console.log(`  Is Active: ${orgPackage.isActive}`);
    console.log(`  Expires At: ${orgPackage.expiresAt}`);
  }

  console.log(`\n3. All organizations in database:`);
  const allOrgs = await organizationRepository.find();
  for (const org of allOrgs) {
    console.log(`- ${org.name} (ID: ${org.id})`);
  }

  console.log('\n=== END DEBUG ===\n');

  return user.organizationId;
}
