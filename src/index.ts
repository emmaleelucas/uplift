import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  route,
  routeStop,
  homelessPerson,
  itemCategory,
  itemType,
  distribution,
  distributionItem,
} from './db/schema';
import routesData from './data/routes.json';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// FAKE DATA
// ============================================

const maleFirstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark',
  'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
  'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan',
];

const femaleFirstNames = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan',
  'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra',
  'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol',
  'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
];

const categoryData = [
  { name: 'Clothing', description: 'Apparel items including shirts, pants, jackets, footwear, and undergarments' },
  { name: 'Basic Needs', description: 'Essential supplies for outdoor survival and comfort' },
  { name: 'Hygiene Items', description: 'Travel-sized personal care and hygiene products' },
];

const itemTypeData: { [key: string]: { name: string }[] } = {
  'Clothing': [
    { name: 'T-Shirt' },
    { name: 'Long Sleeve Shirt' },
    { name: 'Jeans' },
    { name: 'Pants' },
    { name: 'Sweat Pants' },
    { name: 'Shorts' },
    { name: 'Baseball Cap' },
    { name: 'Beanie' },
    { name: 'Socks' },
    { name: 'Boots' },
    { name: 'Sneakers' },
    { name: 'Sandals' },
    { name: 'Hoodie' },
    { name: 'Jacket' },
    { name: 'Coat' },
    { name: 'Sweater' },
    { name: 'Gloves' },
    { name: 'Scarf' },
    { name: 'Underwear' },
  ],
  'Basic Needs': [
    { name: 'Canned Good' },
    { name: 'Half Gallon Plastic Jug' },
    { name: 'Full Gallon Plastic Jug' },
    { name: '1-Liter Plastic Bottle' },
    { name: '2-Liter Plastic Bottle' },
    { name: 'Playing Cards' },
    { name: 'Reading Glasses' },
    { name: 'Matches' },
    { name: 'Lighter' },
    { name: 'Candles' },
    { name: 'Flashlight' },
    { name: 'Headlamp' },
    { name: 'AAA Batteries' },
    { name: 'AA Batteries' },
    { name: 'Backpack' },
    { name: 'Duffel Bag' },
    { name: 'Wheeled Bag' },
    { name: 'Blanket' },
    { name: 'Sleeping Bag' },
    { name: 'Plastic Tarp' },
    { name: 'Tent' },
    { name: 'Bed Pillow' },
    { name: 'Hand Warmers' },
  ],
  'Hygiene Items': [
    { name: 'Shampoo' },
    { name: 'Conditioner' },
    { name: 'Toilet Paper' },
    { name: 'Toothbrush' },
    { name: 'Toothpaste' },
    { name: 'Deodorant' },
    { name: 'Razors' },
    { name: 'Bar Soap' },
    { name: 'Body Wash' },
    { name: 'Cough Syrup' },
    { name: 'Cough Drops' },
    { name: 'Wet Wipes' },
    { name: 'Lotion' },
    { name: 'Bug Wipes' },
    { name: 'Bug Spray' },
  ],
};

// ============================================
// INTERFACES
// ============================================

interface RouteStopJSON {
  number: number;
  name: string;
  location?: string;
  state: string;
  notes?: string;
  coordinates: [number, number];
}

interface RouteJSON {
  name: string;
  stops: RouteStopJSON[];
}

interface RoutesJSON {
  routes: RouteJSON[];
}

// ============================================
// SEED FUNCTION
// ============================================

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ==========================================
    // 0. CLEAR EXISTING DATA
    // ==========================================
    console.log('🗑️  Clearing existing data...');

    // Delete in order of dependencies (children first, then parents)
    await db.delete(distributionItem);
    console.log('  ✓ Cleared distribution items');

    await db.delete(distribution);
    console.log('  ✓ Cleared distributions');

    await db.delete(routeStop);
    console.log('  ✓ Cleared route stops');

    await db.delete(route);
    console.log('  ✓ Cleared routes');

    await db.delete(itemType);
    console.log('  ✓ Cleared item types');

    await db.delete(itemCategory);
    console.log('  ✓ Cleared item categories');

    await db.delete(homelessPerson);
    console.log('  ✓ Cleared homeless persons');

    console.log('  → All tables cleared!\n');

    // ==========================================
    // 1. SEED ROUTES AND STOPS
    // ==========================================
    console.log('📍 Seeding routes and stops...');
    const data = routesData as RoutesJSON;
    const insertedRoutes: { id: string; name: string }[] = [];
    const insertedStops: { id: string; routeId: string; name: string }[] = [];

    for (const routeData of data.routes) {
      const [insertedRoute] = await db
        .insert(route)
        .values({ name: routeData.name })
        .returning();

      insertedRoutes.push(insertedRoute);
      console.log(`  ✓ Route: ${routeData.name}`);

      for (const stop of routeData.stops) {
        const [insertedStop] = await db.insert(routeStop).values({
          routeId: insertedRoute.id,
          stopNumber: stop.number,
          name: stop.name,
          locationDescription: stop.location || stop.notes || null,
          city: 'Kansas City',
          state: stop.state,
          latitude: stop.coordinates[0].toString(),
          longitude: stop.coordinates[1].toString(),
        }).returning();

        insertedStops.push({ id: insertedStop.id, routeId: insertedRoute.id, name: insertedStop.name });
      }
    }
    console.log(`  → Created ${insertedRoutes.length} routes with ${insertedStops.length} stops\n`);

    // ==========================================
    // 2. SEED HOMELESS PERSONS
    // ==========================================
    console.log('👥 Seeding homeless persons...');
    const insertedPersons: { id: string; firstName: string; lastName: string | null }[] = [];

    // Create 30 homeless persons (fewer for simpler seed)
    for (let i = 0; i < 30; i++) {
      const isMale = Math.random() > 0.5;
      const firstName = isMale
        ? randomElement(maleFirstNames)
        : randomElement(femaleFirstNames);
      // 70% have last name, 30% don't
      const lastName = Math.random() > 0.3 ? randomElement(lastNames) : null;
      const ssnLast4Hash = Math.random() > 0.7 ? `hash_${Math.floor(1000 + Math.random() * 9000)}` : null;
      // Person is identifiable if they have last name or SSN
      const isIdentifiable = !!(lastName || ssnLast4Hash);

      const [person] = await db.insert(homelessPerson).values({
        firstName,
        lastName,
        ssnLast4Hash,
        isIdentifiable,
      }).returning();

      insertedPersons.push({ id: person.id, firstName: person.firstName, lastName: person.lastName });
    }
    console.log(`  → Created ${insertedPersons.length} homeless persons\n`);

    // ==========================================
    // 3. SEED ITEM CATEGORIES
    // ==========================================
    console.log('📦 Seeding item categories...');
    const insertedCategories: { id: string; name: string }[] = [];

    for (const cat of categoryData) {
      const [insertedCat] = await db.insert(itemCategory).values({
        name: cat.name,
        description: cat.description,
      }).returning();

      insertedCategories.push(insertedCat);
      console.log(`  ✓ Category: ${cat.name}`);
    }
    console.log('');

    // ==========================================
    // 4. SEED ITEM TYPES
    // ==========================================
    console.log('🏷️ Seeding item types...');
    const insertedItemTypes: { id: string; name: string; itemCategoryId: string }[] = [];

    for (const cat of insertedCategories) {
      const items = itemTypeData[cat.name] || [];
      for (const item of items) {
        const [insertedItem] = await db.insert(itemType).values({
          name: item.name,
          itemCategoryId: cat.id,
        }).returning();

        insertedItemTypes.push({
          id: insertedItem.id,
          name: insertedItem.name,
          itemCategoryId: cat.id,
        });
      }
    }
    console.log(`  → Created ${insertedItemTypes.length} item types\n`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('═══════════════════════════════════════════');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log(`📍 Routes:            ${insertedRoutes.length}`);
    console.log(`📍 Route Stops:       ${insertedStops.length}`);
    console.log(`👥 Homeless Persons:  ${insertedPersons.length}`);
    console.log(`📦 Item Categories:   ${insertedCategories.length}`);
    console.log(`🏷️  Item Types:        ${insertedItemTypes.length}`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
