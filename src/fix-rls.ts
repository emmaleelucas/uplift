import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function fixRLS() {
    const client = await pool.connect();

    try {
        console.log('🔐 Fixing Row Level Security policies...\n');

        // Tables that need public read access
        const publicReadTables = [
            'item_category',
            'item_type',
            'route',
            'route_stop',
            'homeless_person',
            'distribution',
            'distribution_item'
        ];

        for (const table of publicReadTables) {
            console.log(`Setting up RLS for ${table}...`);

            // Enable RLS (if not already)
            await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);

            // Drop existing policies if any
            await client.query(`DROP POLICY IF EXISTS "${table}_public_read" ON ${table}`);
            await client.query(`DROP POLICY IF EXISTS "${table}_public_insert" ON ${table}`);
            await client.query(`DROP POLICY IF EXISTS "${table}_public_update" ON ${table}`);
            await client.query(`DROP POLICY IF EXISTS "${table}_public_delete" ON ${table}`);

            // Create policy for public read access
            await client.query(`
                CREATE POLICY "${table}_public_read" ON ${table}
                FOR SELECT USING (true)
            `);

            // Create policy for public insert access
            await client.query(`
                CREATE POLICY "${table}_public_insert" ON ${table}
                FOR INSERT WITH CHECK (true)
            `);

            // Create policy for public update access
            await client.query(`
                CREATE POLICY "${table}_public_update" ON ${table}
                FOR UPDATE USING (true) WITH CHECK (true)
            `);

            // Create policy for public delete access
            await client.query(`
                CREATE POLICY "${table}_public_delete" ON ${table}
                FOR DELETE USING (true)
            `);

            console.log(`   ✓ ${table} - RLS enabled with public access policies`);
        }

        console.log('\n✅ RLS policies configured successfully!');

    } catch (error) {
        console.error('❌ Failed to configure RLS:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixRLS();
