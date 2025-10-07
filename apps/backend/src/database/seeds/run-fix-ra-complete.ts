import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { fixRaPermissionsComplete } from './fix-ra-permissions-complete';

// Load environment variables
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'event_booking',
  entities: ['src/database/entities/*.entity.ts'],
  synchronize: false,
  logging: false,
});

async function main() {
  try {
    console.log('🚀 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    await fixRaPermissionsComplete(dataSource);

    console.log('🎉 Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

main();
