// Seed script for clothing items
// Run with: npx tsx src/db/seed-clothing.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Size configurations for different item types
const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const SHOE_SIZES = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14'];
const ONE_SIZE = ['one_size'];

// Clothing items configuration
const CLOTHING_ITEMS = [
    // One-size items (unisex only)
    { name: 'Beanie', sizes: ONE_SIZE, genders: ['none'] },
    { name: 'Baseball Cap', sizes: ONE_SIZE, genders: ['none'] },
    { name: 'Scarf', sizes: ONE_SIZE, genders: ['none'] },

    // Standard sized items (male/female)
    { name: 'T-Shirt', sizes: STANDARD_SIZES, genders: ['male', 'female'] },
    { name: 'Long Sleeve Shirt', sizes: STANDARD_SIZES, genders: ['male', 'female'] },
    { name: 'Pants', sizes: STANDARD_SIZES, genders: ['male', 'female'] },
    { name: 'Shorts', sizes: STANDARD_SIZES, genders: ['male', 'female'] },
    { name: 'Jacket', sizes: STANDARD_SIZES, genders: ['male', 'female'] },
    { name: 'Coat', sizes: STANDARD_SIZES, genders: ['male', 'female'] },
    { name: 'Hoodie', sizes: STANDARD_SIZES, genders: ['male', 'female'] },
    { name: 'Sweater', sizes: STANDARD_SIZES, genders: ['male', 'female'] },
    { name: 'Underwear', sizes: STANDARD_SIZES, genders: ['male', 'female'] },
    { name: 'Socks', sizes: STANDARD_SIZES, genders: ['none'] },
    { name: 'Gloves', sizes: STANDARD_SIZES, genders: ['none'] },

    // Shoes (male/female with shoe sizes)
    { name: 'Shoes', sizes: SHOE_SIZES, genders: ['male', 'female'] },
    { name: 'Boots', sizes: SHOE_SIZES, genders: ['male', 'female'] },
    { name: 'Sandals', sizes: SHOE_SIZES, genders: ['male', 'female'] },
];

// Non-clothing items
const OTHER_ITEMS = {
    'Hygiene': [
        'Toothbrush',
        'Toothpaste',
        'Soap',
        'Shampoo',
        'Conditioner',
        'Deodorant',
        'Razor',
        'Feminine Products',
        'Hand Sanitizer',
        'Tissue Pack',
        'Wet Wipes',
    ],
    'Basic Needs': [
        'Sleeping Bag',
        'Blanket',
        'Backpack',
        'Water Bottle',
        'Flashlight',
        'First Aid Kit',
        'Sunscreen',
        'Chapstick',
        'Rain Poncho',
    ],
    'Canned Goods': [
        'Canned Soup',
        'Canned Vegetables',
        'Canned Beans',
        'Canned Fruit',
        'Canned Tuna',
        'Canned Chicken',
        'Peanut Butter',
        'Crackers',
        'Granola Bars',
        'Bottled Water',
    ],
};

async function seed() {
    console.log('🌱 Starting database seed...\n');

    // Get or create categories
    const categoryIds: { [key: string]: string } = {};

    const categories = ['Clothing', 'Hygiene', 'Basic Needs', 'Canned Goods'];

    for (const categoryName of categories) {
        // Check if category exists
        const { data: existing } = await supabase
            .from('category')
            .select('id')
            .eq('name', categoryName)
            .single();

        if (existing) {
            categoryIds[categoryName] = existing.id;
            console.log(`✓ Category "${categoryName}" already exists`);
        } else {
            const { data: created, error } = await supabase
                .from('category')
                .insert({ name: categoryName })
                .select('id')
                .single();

            if (error) {
                console.error(`✗ Error creating category "${categoryName}":`, error);
                continue;
            }
            categoryIds[categoryName] = created!.id;
            console.log(`+ Created category "${categoryName}"`);
        }
    }

    console.log('\n📦 Seeding clothing items...\n');

    // Seed clothing items
    let clothingCount = 0;
    for (const item of CLOTHING_ITEMS) {
        for (const gender of item.genders) {
            for (const size of item.sizes) {
                // Check if item already exists
                const { data: existing } = await supabase
                    .from('item_type')
                    .select('id')
                    .eq('name', item.name)
                    .eq('gender', gender)
                    .eq('size', size)
                    .single();

                if (existing) {
                    continue; // Skip if already exists
                }

                const { error } = await supabase
                    .from('item_type')
                    .insert({
                        name: item.name,
                        category_id: categoryIds['Clothing'],
                        gender: gender,
                        size: size,
                        need_level: 'mid',
                    });

                if (error) {
                    console.error(`✗ Error creating ${item.name} (${gender}, ${size}):`, error.message);
                } else {
                    clothingCount++;
                }
            }
        }
        console.log(`✓ Seeded ${item.name}`);
    }

    console.log(`\n📦 Created ${clothingCount} clothing item variants\n`);

    // Seed other items
    console.log('📦 Seeding other items...\n');

    for (const [categoryName, items] of Object.entries(OTHER_ITEMS)) {
        for (const itemName of items) {
            // Check if item already exists
            const { data: existing } = await supabase
                .from('item_type')
                .select('id')
                .eq('name', itemName)
                .eq('category_id', categoryIds[categoryName])
                .single();

            if (existing) {
                continue; // Skip if already exists
            }

            const { error } = await supabase
                .from('item_type')
                .insert({
                    name: itemName,
                    category_id: categoryIds[categoryName],
                    gender: 'none',
                    size: null,
                    need_level: 'mid',
                });

            if (error) {
                console.error(`✗ Error creating ${itemName}:`, error.message);
            }
        }
        console.log(`✓ Seeded ${categoryName} items`);
    }

    console.log('\n✅ Database seed complete!');
}

seed().catch(console.error);
