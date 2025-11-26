import pg from 'pg';
const { Client } = pg;

const configs = [
  {
    name: 'Port 5432 (Direct)',
    connectionString: 'postgresql://postgres.lvciqbweooripjmltxwh:Badem2005acd@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
  },
  {
    name: 'Port 6543 (Pooler)',
    connectionString: 'postgresql://postgres.lvciqbweooripjmltxwh:Badem2005acd@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'
  }
];

async function testConnections() {
  for (const config of configs) {
    console.log(`\n🔌 Testing: ${config.name}`);
    console.log(`   URL: ${config.connectionString.replace('Badem2005acd', '***')}`);
    
    const client = new Client({ connectionString: config.connectionString });
    
    try {
      await client.connect();
      const result = await client.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = $1', ['public']);
      console.log(`   ✅ SUCCESS! Found ${result.rows[0].count} tables`);
      await client.end();
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
    }
  }
}

testConnections();
