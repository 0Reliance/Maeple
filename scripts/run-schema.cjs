const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://neondb_owner:npg_eHoO39SQynwc@ep-rapid-dust-ad9xr8v9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function runSchema() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running schema...');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Schema executed successfully!');
    console.log('Tables created: users, user_settings, health_entries');
    
  } catch (error) {
    console.error('❌ Error running schema:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runSchema();