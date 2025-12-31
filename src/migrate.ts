import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('🔄 Running migration to simplify schema...\n');

        // Drop old tables that were removed from schema
        console.log('1. Dropping old tables...');

        // First drop route_run (depends on route, van, driver)
        await client.query('DROP TABLE IF EXISTS route_run CASCADE');
        console.log('   ✓ Dropped route_run');

        // Drop van and driver
        await client.query('DROP TABLE IF EXISTS van CASCADE');
        console.log('   ✓ Dropped van');

        await client.query('DROP TABLE IF EXISTS driver CASCADE');
        console.log('   ✓ Dropped driver');

        // Drop warehouse_inventory
        await client.query('DROP TABLE IF EXISTS warehouse_inventory CASCADE');
        console.log('   ✓ Dropped warehouse_inventory');

        // Drop old category table if exists (renamed to item_category)
        await client.query('DROP TABLE IF EXISTS category CASCADE');
        console.log('   ✓ Dropped category (if existed)');

        // Drop old enums
        console.log('\n2. Dropping old enums...');
        await client.query('DROP TYPE IF EXISTS inventory_level CASCADE');
        console.log('   ✓ Dropped inventory_level enum');

        await client.query('DROP TYPE IF EXISTS need_level CASCADE');
        console.log('   ✓ Dropped need_level enum');

        await client.query('DROP TYPE IF EXISTS gender CASCADE');
        console.log('   ✓ Dropped gender enum');

        await client.query('DROP TYPE IF EXISTS clothing_size CASCADE');
        console.log('   ✓ Dropped clothing_size enum');

        // Update distribution table
        console.log('\n3. Updating distribution table...');

        // Remove old columns if they exist
        await client.query(`
            ALTER TABLE distribution
            DROP COLUMN IF EXISTS route_run_id,
            DROP COLUMN IF EXISTS distributed_at
        `);
        console.log('   ✓ Removed old columns (route_run_id, distributed_at)');

        // Change meal_served to boolean if it's not already
        const mealServedType = await client.query(`
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'distribution' AND column_name = 'meal_served'
        `);

        if (mealServedType.rows.length > 0 && mealServedType.rows[0].data_type !== 'boolean') {
            // Add temp column, migrate data, drop old, rename
            await client.query(`
                ALTER TABLE distribution ADD COLUMN IF NOT EXISTS meal_served_bool boolean DEFAULT false;
                UPDATE distribution SET meal_served_bool = (meal_served > 0);
                ALTER TABLE distribution DROP COLUMN meal_served;
                ALTER TABLE distribution RENAME COLUMN meal_served_bool TO meal_served;
            `);
            console.log('   ✓ Converted meal_served to boolean');
        } else {
            console.log('   ✓ meal_served is already boolean');
        }

        // Add meals_take_away column if it doesn't exist
        await client.query(`
            ALTER TABLE distribution
            ADD COLUMN IF NOT EXISTS meals_take_away integer DEFAULT 0 NOT NULL
        `);
        console.log('   ✓ Added meals_take_away column');

        // Update item_type table - remove old columns
        console.log('\n4. Updating item_type table...');
        await client.query(`
            ALTER TABLE item_type
            DROP COLUMN IF EXISTS notes,
            DROP COLUMN IF EXISTS need_level,
            DROP COLUMN IF EXISTS gender,
            DROP COLUMN IF EXISTS size
        `);
        console.log('   ✓ Removed old columns from item_type');

        // Rename category_id to item_category_id in item_type table
        console.log('\n5. Renaming category_id to item_category_id...');
        const categoryIdExists = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'item_type' AND column_name = 'category_id'
        `);
        if (categoryIdExists.rows.length > 0) {
            await client.query(`
                ALTER TABLE item_type
                RENAME COLUMN category_id TO item_category_id
            `);
            console.log('   ✓ Renamed category_id to item_category_id');
        } else {
            console.log('   ✓ Column already named item_category_id');
        }

        // Add last_name column to homeless_person table
        console.log('\n6. Adding last_name column to homeless_person...');
        await client.query(`
            ALTER TABLE homeless_person
            ADD COLUMN IF NOT EXISTS last_name text
        `);
        console.log('   ✓ Added last_name column');

        // Add is_identifiable column to homeless_person table
        console.log('\n7. Adding is_identifiable column to homeless_person...');
        await client.query(`
            ALTER TABLE homeless_person
            ADD COLUMN IF NOT EXISTS is_identifiable boolean DEFAULT false NOT NULL
        `);
        console.log('   ✓ Added is_identifiable column');

        // Set is_identifiable to true for existing records that have last_name or ssn_last4_hash
        console.log('   Updating existing records...');
        await client.query(`
            UPDATE homeless_person
            SET is_identifiable = true
            WHERE last_name IS NOT NULL OR ssn_last4_hash IS NOT NULL
        `);
        console.log('   ✓ Updated existing records with is_identifiable');

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
