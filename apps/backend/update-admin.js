const { Client } = require('pg');

async function updateAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'event_booking',
    user: 'postgres',
    password: 'admin', // From .env file
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First check the table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('Users table columns:', tableInfo.rows);

    // Update admin user to have product_admin user type
    const result = await client.query(`
      UPDATE users
      SET "userType" = 'product_admin'
      WHERE email = 'admin@eventbooking.com'
      RETURNING id, email, "userType";
    `);

    if (result.rows.length > 0) {
      console.log('Admin user updated successfully:', result.rows[0]);
    } else {
      console.log('Admin user not found');
    }

    await client.end();
  } catch (error) {
    console.error('Error updating admin user:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.log('Please update the password in this script to match your PostgreSQL password');
    }
    process.exit(1);
  }
}

updateAdmin();
