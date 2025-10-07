import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { OrganizationSetupSeed } from './organization-setup.seed';

async function runOrganizationSetup() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    const seed = new OrganizationSetupSeed(dataSource);
    await seed.run();
    
    console.log('🎉 Organization setup completed successfully');
  } catch (error) {
    console.error('❌ Error running organization setup:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

runOrganizationSetup();
