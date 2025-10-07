import { AppDataSource } from '../data-source';
import { debugPackagePermissions } from './debug-package-permissions';
import { debugUserOrganization } from './debug-user-org';

async function main() {
  const dataSource = AppDataSource;

  try {
    await dataSource.initialize();
    console.log('Database connected successfully');

    const userOrgId = await debugUserOrganization(dataSource);
    if (userOrgId) {
      await debugPackagePermissions(dataSource, userOrgId);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

main().catch(console.error);
