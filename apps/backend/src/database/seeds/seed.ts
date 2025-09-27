#!/usr/bin/env node

import { AppDataSource } from '../data-source';
import { InitialDataSeed } from './initial-data.seed';
import { SampleDataSeed } from './sample-data.seed';

async function runSeeds() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize data source
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Run initial data seed (permissions, roles, admin user)
    const initialSeed = new InitialDataSeed(AppDataSource);
    await initialSeed.run();

    // Run sample data seed (inventory, events) - only in development
    if (process.env.NODE_ENV === 'development' || process.argv.includes('--sample-data')) {
      const sampleSeed = new SampleDataSeed(AppDataSource);
      await sampleSeed.run();
    }

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run if called directly
if (require.main === module) {
  runSeeds();
}

export { runSeeds };
