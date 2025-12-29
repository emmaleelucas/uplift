import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  route,
  routeStop,
  homelessPerson,
  category,
  itemType,
  warehouseInventory,
  van,
  driver,
  routeRun,
  distribution,
  distributionItem,
} from './db/schema';
import routesData from '../routes.json';

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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
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

const vanNames = [
  'Hope Mobile', 'Mercy Van', 'Helping Hands', 'Community Care', 'Street Angels',
];

const licensePlates = [
  'KC-1234', 'MO-5678', 'KS-9012', 'UPLIFT1', 'HOPE-KC',
];

const categoryData = [
  { name: 'Clothing', description: 'Apparel items including shirts, pants, jackets, footwear, and undergarments' },
  { name: 'Basic Needs', description: 'Essential supplies for outdoor survival and comfort' },
  { name: 'Hygiene Items', description: 'Travel-sized personal care and hygiene products' },
  { name: 'Canned Goods', description: 'Non-perishable canned food items - pop-top preferred, no glass, no expired food' },
];

// Clothing sizes - using enum values
const standardSizes: readonly string[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const shoeSizes: readonly string[] = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14'];
const oneSize: readonly string[] = ['one_size'];

// Gender options
const allGenders: readonly ('male' | 'female' | 'none')[] = ['male', 'female', 'none'];
const unisexOnly: readonly ('male' | 'female' | 'none')[] = ['none'];

const itemTypeData: { [key: string]: { name: string; sizes?: readonly string[]; genders?: readonly ('male' | 'female' | 'none')[] }[] } = {
  'Clothing': [
    // Shirts - all genders
    { name: 'T-Shirt', sizes: standardSizes, genders: allGenders },
    { name: 'Long Sleeve Shirt', sizes: standardSizes, genders: allGenders },
    // Pants - all genders  
    { name: 'Jeans', sizes: standardSizes, genders: allGenders },
    { name: 'Pants', sizes: standardSizes, genders: allGenders },
    { name: 'Sweat Pants', sizes: standardSizes, genders: allGenders },
    { name: 'Shorts', sizes: standardSizes, genders: allGenders },
    // Headwear - unisex only
    { name: 'Baseball Cap', sizes: oneSize, genders: unisexOnly },
    { name: 'Beanie', sizes: oneSize, genders: unisexOnly },
    // Footwear
    { name: 'Socks', sizes: standardSizes, genders: unisexOnly },  // unisex only
    { name: 'Boots', sizes: shoeSizes, genders: allGenders },
    { name: 'Sneakers', sizes: shoeSizes, genders: allGenders },
    { name: 'Sandals', sizes: shoeSizes, genders: allGenders },
    // Outerwear - all genders
    { name: 'Hoodie', sizes: standardSizes, genders: allGenders },
    { name: 'Jacket', sizes: standardSizes, genders: allGenders },
    { name: 'Coat', sizes: standardSizes, genders: allGenders },
    { name: 'Sweater', sizes: standardSizes, genders: allGenders },
    // Accessories - unisex only
    { name: 'Gloves', sizes: standardSizes, genders: unisexOnly },
    { name: 'Scarf', sizes: oneSize, genders: unisexOnly },
    // Undergarments - all genders
    { name: 'Underwear', sizes: standardSizes, genders: allGenders },
  ],
  'Basic Needs': [
    // Water containers
    { name: 'Half Gallon Plastic Jug' },
    { name: 'Full Gallon Plastic Jug' },
    { name: '1-Liter Plastic Bottle' },
    { name: '2-Liter Plastic Bottle' },
    // Entertainment & Vision
    { name: 'Playing Cards' },
    { name: 'Reading Glasses' },
    // Fire & Light
    { name: 'Matches' },
    { name: 'Lighter' },
    { name: 'Candles' },
    { name: 'Flashlight' },
    { name: 'Headlamp' },
    // Batteries
    { name: 'AAA Batteries' },
    { name: 'AA Batteries' },
    // Bags
    { name: 'Backpack' },
    { name: 'Duffel Bag' },
    { name: 'Wheeled Bag' },
    // Bedding & Shelter
    { name: 'Blanket' },
    { name: 'Sleeping Bag' },
    { name: 'Plastic Tarp' },
    { name: 'Tent' },
    { name: 'Bed Pillow' },
    // Warmth
    { name: 'Hand Warmers' },
  ],
  'Hygiene Items': [
    // Hair care
    { name: 'Shampoo' },
    { name: 'Conditioner' },
    // Bathroom essentials
    { name: 'Toilet Paper' },
    { name: 'Toothbrush' },
    { name: 'Toothpaste' },
    // Personal care
    { name: 'Deodorant' },
    { name: 'Razors' },
    { name: 'Bar Soap' },
    { name: 'Body Wash' },
    // Health
    { name: 'Cough Syrup' },
    { name: 'Cough Drops' },
    // Cleaning
    { name: 'Wet Wipes' },
    { name: 'Lotion' },
    // Bug protection
    { name: 'Bug Wipes' },
    { name: 'Bug Spray' },
  ],
  'Canned Goods': [
    { name: 'Canned Fruit' },
    { name: 'Tuna' },
    { name: 'Beef Stew' },
    { name: 'Chili' },
    { name: 'Pork & Beans' },
    { name: 'Ravioli' },
    { name: 'Spaghetti' },
    { name: 'Spam' },
    { name: 'Vienna Sausage' },
    { name: 'Canned Soup' },
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
  console.log('🌱 Starting comprehensive database seed...\n');

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

    await db.delete(routeRun);
    console.log('  ✓ Cleared route runs');

    await db.delete(routeStop);
    console.log('  ✓ Cleared route stops');

    await db.delete(route);
    console.log('  ✓ Cleared routes');

    await db.delete(warehouseInventory);
    console.log('  ✓ Cleared warehouse inventory');

    await db.delete(itemType);
    console.log('  ✓ Cleared item types');

    await db.delete(category);
    console.log('  ✓ Cleared categories');

    await db.delete(homelessPerson);
    console.log('  ✓ Cleared homeless persons');

    await db.delete(driver);
    console.log('  ✓ Cleared drivers');

    await db.delete(van);
    console.log('  ✓ Cleared vans');

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
    const insertedPersons: { id: string; firstName: string }[] = [];

    // Create 60 homeless persons
    for (let i = 0; i < 60; i++) {
      const isMale = Math.random() > 0.5;
      const firstName = isMale
        ? randomElement(maleFirstNames)
        : randomElement(femaleFirstNames);

      const [person] = await db.insert(homelessPerson).values({
        firstName,
        ssnLast4Hash: Math.random() > 0.7 ? `hash_${randomInt(1000, 9999)}` : null,
      }).returning();

      insertedPersons.push({ id: person.id, firstName: person.firstName });
    }
    console.log(`  → Created ${insertedPersons.length} homeless persons\n`);

    // ==========================================
    // 3. SEED CATEGORIES
    // ==========================================
    console.log('📦 Seeding categories...');
    const insertedCategories: { id: string; name: string }[] = [];

    for (const cat of categoryData) {
      const [insertedCat] = await db.insert(category).values({
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
    const insertedItemTypes: { id: string; name: string; categoryId: string; gender: 'male' | 'female' | 'none'; size: string | null }[] = [];

    for (const cat of insertedCategories) {
      const items = itemTypeData[cat.name] || [];
      for (const item of items) {
        const sizes = item.sizes || [null];
        // If genders not specified, use [null] to create one item with null gender
        const genders = item.genders || [null];

        for (const size of sizes) {
          for (const gender of genders) {
            const needLevel = randomElement(['low', 'mid', 'high'] as const);
            const [insertedItem] = await db.insert(itemType).values({
              name: item.name,
              categoryId: cat.id,
              gender: gender, // Will be null for non-clothing items
              size: (size || null) as typeof itemType.$inferInsert['size'],
              needLevel,
              notes: Math.random() > 0.8 ? 'Popular item - restock frequently' : null,
            }).returning();

            insertedItemTypes.push({
              id: insertedItem.id,
              name: insertedItem.name,
              categoryId: cat.id,
              gender: insertedItem.gender || 'none',
              size: insertedItem.size,
            });
          }
        }
      }
    }
    console.log(`  → Created ${insertedItemTypes.length} item types\n`);

    // ==========================================
    // 5. SEED WAREHOUSE INVENTORY
    // ==========================================
    console.log('🏭 Seeding warehouse inventory...');
    let inventoryCount = 0;

    for (const item of insertedItemTypes) {
      const inventoryLevel = randomElement(['low', 'mid', 'high'] as const);
      await db.insert(warehouseInventory).values({
        itemTypeId: item.id,
        inventoryLevel,
      });
      inventoryCount++;
    }
    console.log(`  → Created ${inventoryCount} inventory records\n`);

    // ==========================================
    // 6. SEED VANS
    // ==========================================
    console.log('🚐 Seeding vans...');
    const insertedVans: { id: string; name: string }[] = [];

    for (let i = 0; i < vanNames.length; i++) {
      const [insertedVan] = await db.insert(van).values({
        name: vanNames[i],
        licensePlate: licensePlates[i],
      }).returning();

      insertedVans.push(insertedVan);
      console.log(`  ✓ Van: ${vanNames[i]} (${licensePlates[i]})`);
    }
    console.log('');

    // ==========================================
    // 7. SEED DRIVERS
    // ==========================================
    console.log('🧑‍✈️ Seeding drivers...');
    const insertedDrivers: { id: string; firstName: string; lastName: string | null }[] = [];

    const driverData = [
      { first: 'Marcus', last: 'Thompson', phone: '816-555-0101' },
      { first: 'Sarah', last: 'Chen', phone: '816-555-0102' },
      { first: 'David', last: 'Rodriguez', phone: '913-555-0103' },
      { first: 'Emily', last: 'Williams', phone: '816-555-0104' },
      { first: 'James', last: 'Brown', phone: '913-555-0105' },
      { first: 'Maria', last: 'Garcia', phone: '816-555-0106' },
      { first: 'Robert', last: 'Johnson', phone: '816-555-0107' },
      { first: 'Lisa', last: 'Davis', phone: '913-555-0108' },
    ];

    for (const d of driverData) {
      const [insertedDriver] = await db.insert(driver).values({
        firstName: d.first,
        lastName: d.last,
        phone: d.phone,
      }).returning();

      insertedDrivers.push(insertedDriver);
      console.log(`  ✓ Driver: ${d.first} ${d.last}`);
    }
    console.log('');

    // ==========================================
    // 8. SEED ROUTE RUNS
    // ==========================================
    console.log('🗓️ Seeding route runs...');
    const insertedRouteRuns: { id: string; routeId: string; runDate: string }[] = [];

    // Specific distribution dates for the past 2 weeks (Mon, Wed, Sat schedule)
    const distributionDates = [
      '2025-12-15', // Monday
      '2025-12-17', // Wednesday
      '2025-12-20', // Saturday
      '2025-12-22', // Monday
      '2025-12-24', // Wednesday (Christmas Eve)
      '2025-12-27', // Saturday
    ];

    // Create route runs for all 4 routes on each distribution date
    for (const runDateStr of distributionDates) {
      console.log(`  📅 Creating runs for ${runDateStr}...`);

      for (const selectedRoute of insertedRoutes) {
        const selectedDriver = randomElement(insertedDrivers);
        const selectedVan = randomElement(insertedVans);

        const notes = Math.random() > 0.7
          ? randomElement([
            'Good weather, high turnout',
            'Rain - distributed rain ponchos',
            'Cold day - many requests for blankets',
            'Distributed winter supplies',
            'New faces at several stops',
            'Busy route - ran low on socks',
          ])
          : null;

        const [insertedRun] = await db.insert(routeRun).values({
          routeId: selectedRoute.id,
          runDate: runDateStr,
          driverId: selectedDriver.id,
          vanId: selectedVan.id,
          notes,
        }).returning();

        insertedRouteRuns.push({
          id: insertedRun.id,
          routeId: selectedRoute.id,
          runDate: runDateStr,
        });

        console.log(`    ✓ ${selectedRoute.name}`);
      }
    }
    console.log(`  → Created ${insertedRouteRuns.length} route runs\n`);

    // ==========================================
    // 9. SEED DISTRIBUTIONS
    // ==========================================
    console.log('📋 Seeding distributions...');
    let distributionCount = 0;
    let distributionItemCount = 0;

    // For each route run, create distributions at each stop
    for (const run of insertedRouteRuns) {
      // Get stops for this route
      const routeStops = insertedStops.filter(s => s.routeId === run.routeId);

      // Determine start time based on day of week (Sat = 5pm, Mon/Wed = 6pm)
      const runDate = new Date(run.runDate + 'T00:00:00');
      const dayOfWeek = runDate.getDay();
      const startHour = dayOfWeek === 6 ? 17 : 18; // 5pm for Saturday, 6pm otherwise

      // For each stop on the route
      for (let stopIndex = 0; stopIndex < routeStops.length; stopIndex++) {
        const currentStop = routeStops[stopIndex];

        // Create 3-12 distributions per stop (varies by stop)
        const numPeopleAtStop = randomInt(3, 12);

        // Calculate time at this stop (roughly 15-20 minutes per stop)
        const minutesIntoRoute = stopIndex * randomInt(15, 20);
        const stopTime = new Date(run.runDate + 'T00:00:00');
        stopTime.setHours(startHour, minutesIntoRoute, 0, 0);

        for (let i = 0; i < numPeopleAtStop; i++) {
          const selectedPerson = randomElement(insertedPersons);
          const mealServed = Math.random() > 0.3 ? randomInt(1, 2) : 0; // 70% get meals, some get 2

          // Add a few minutes variation for each person at the stop
          const personTime = new Date(stopTime);
          personTime.setMinutes(personTime.getMinutes() + randomInt(0, 10));

          // Create the distribution record with proper timestamp
          const [insertedDistribution] = await db.insert(distribution).values({
            routeRunId: run.id,
            routeStopId: currentStop.id,
            homelessPersonId: selectedPerson.id,
            mealServed,
            distributedAt: personTime,
            createdAt: personTime,
          }).returning();

          // Give each person 1-4 items
          const numItems = randomInt(1, 4);
          const givenItems = new Set<string>(); // Track items already given to avoid duplicates

          for (let j = 0; j < numItems; j++) {
            let selectedItem = randomElement(insertedItemTypes);
            // Avoid duplicate items for same person
            let attempts = 0;
            while (givenItems.has(selectedItem.id) && attempts < 10) {
              selectedItem = randomElement(insertedItemTypes);
              attempts++;
            }
            givenItems.add(selectedItem.id);

            const quantity = randomInt(1, 2);

            await db.insert(distributionItem).values({
              distributionId: insertedDistribution.id,
              itemTypeId: selectedItem.id,
              quantity,
            });

            distributionItemCount++;
          }

          distributionCount++;
        }
      }
    }
    console.log(`  → Created ${distributionCount} distribution records`);
    console.log(`  → Created ${distributionItemCount} distribution items\n`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('═══════════════════════════════════════════');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log(`📍 Routes:            ${insertedRoutes.length}`);
    console.log(`📍 Route Stops:       ${insertedStops.length}`);
    console.log(`👥 Homeless Persons:  ${insertedPersons.length}`);
    console.log(`📦 Categories:        ${insertedCategories.length}`);
    console.log(`🏷️  Item Types:        ${insertedItemTypes.length}`);
    console.log(`🏭 Inventory Records: ${inventoryCount}`);
    console.log(`🚐 Vans:              ${insertedVans.length}`);
    console.log(`🧑‍✈️ Drivers:           ${insertedDrivers.length}`);
    console.log(`🗓️  Route Runs:        ${insertedRouteRuns.length}`);
    console.log(`📋 Distributions:     ${distributionCount}`);
    console.log(`📦 Distribution Items: ${distributionItemCount}`);
    console.log('═══════════════════════════════════════════');
    console.log('\n📅 Distribution dates seeded:');
    distributionDates.forEach(d => console.log(`   - ${d}`));
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();