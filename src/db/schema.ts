// db/schema.ts
import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    pgEnum,
    numeric,
    date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ======================
   ENUMS
====================== */

export const inventoryLevelEnum = pgEnum("inventory_level", [
    "low",
    "mid",
    "high",
]);

export const needLevelEnum = pgEnum("need_level", [
    "low",
    "mid",
    "high",
]);

/* ======================
   PEOPLE
====================== */

export const homelessPerson = pgTable("homeless_person", {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    ssnLast4Hash: text("ssn_last4_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ======================
   INVENTORY
====================== */

export const category = pgTable("category", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
});

export const itemType = pgTable("item_type", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    categoryId: uuid("category_id")
        .references(() => category.id)
        .notNull(),
    needLevel: needLevelEnum("need_level").notNull(),
    notes: text("notes"),
});

export const warehouseInventory = pgTable("warehouse_inventory", {
    id: uuid("id").primaryKey().defaultRandom(),
    itemTypeId: uuid("item_type_id")
        .references(() => itemType.id)
        .notNull(),
    inventoryLevel: inventoryLevelEnum("inventory_level").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ======================
   VANS
====================== */

export const van = pgTable("van", {
    id: uuid("id").primaryKey().defaultRandom(),
    licensePlate: text("license_plate").notNull(),
    name: text("name").notNull(),
});

/* ======================
   DRIVERS
====================== */

export const driver = pgTable("driver", {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    phone: text("phone"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ======================
   ROUTES
====================== */

export const route = pgTable("route", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
});

/* ======================
   ROUTE STOPS
====================== */

export const routeStop = pgTable("route_stop", {
    id: uuid("id").primaryKey().defaultRandom(),
    routeId: uuid("route_id")
        .references(() => route.id)
        .notNull(),
    stopNumber: integer("stop_number").notNull(),
    name: text("name").notNull(),
    locationDescription: text("location_description"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
    longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
});

/* ======================
   ROUTE RUNS
====================== */

export const routeRun = pgTable("route_run", {
    id: uuid("id").primaryKey().defaultRandom(),
    routeId: uuid("route_id")
        .references(() => route.id)
        .notNull(),
    runDate: date("run_date").notNull(),
    driverId: uuid("driver_id")
        .references(() => driver.id)
        .notNull(),
    vanId: uuid("van_id")
        .references(() => van.id)
        .notNull(),
    notes: text("notes"),
});

/* ======================
   DISTRIBUTION
   (Parent record for each service encounter)
====================== */

export const distribution = pgTable("distribution", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Person served (required)
    homelessPersonId: uuid("homeless_person_id")
        .references(() => homelessPerson.id)
        .notNull(),

    // Meal tracking
    mealServed: integer("meal_served").default(0).notNull(), // 0 = no, 1 = yes

    // GPS location (captured from device)
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),

    // Route/Stop association (optional - can be auto-matched via geofence)
    routeStopId: uuid("route_stop_id")
        .references(() => routeStop.id),
    routeRunId: uuid("route_run_id")
        .references(() => routeRun.id),

    // Timestamps
    distributedAt: timestamp("distributed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ======================
   DISTRIBUTION ITEM
   (Items given during a distribution)
====================== */

export const distributionItem = pgTable("distribution_item", {
    id: uuid("id").primaryKey().defaultRandom(),
    distributionId: uuid("distribution_id")
        .references(() => distribution.id)
        .notNull(),
    itemTypeId: uuid("item_type_id")
        .references(() => itemType.id)
        .notNull(),
    quantity: integer("quantity").default(1).notNull(),
});

/* ======================
   RELATIONS
====================== */

/* Homeless Person */
export const homelessPersonRelations = relations(homelessPerson, ({ many }) => ({
    distributions: many(distribution),
}));

/* Category */
export const categoryRelations = relations(category, ({ many }) => ({
    itemTypes: many(itemType),
}));

/* Item Type */
export const itemTypeRelations = relations(itemType, ({ one, many }) => ({
    category: one(category, {
        fields: [itemType.categoryId],
        references: [category.id],
    }),
    inventory: one(warehouseInventory),
    distributions: many(distribution),
}));

/* Warehouse Inventory */
export const warehouseInventoryRelations = relations(
    warehouseInventory,
    ({ one }) => ({
        itemType: one(itemType, {
            fields: [warehouseInventory.itemTypeId],
            references: [itemType.id],
        }),
    }),
);

/* Van */
export const vanRelations = relations(van, ({ many }) => ({
    routeRuns: many(routeRun),
}));

/* Driver */
export const driverRelations = relations(driver, ({ many }) => ({
    routeRuns: many(routeRun),
}));

/* Route */
export const routeRelations = relations(route, ({ many }) => ({
    stops: many(routeStop),
    runs: many(routeRun),
}));

/* Route Stop */
export const routeStopRelations = relations(routeStop, ({ one, many }) => ({
    route: one(route, {
        fields: [routeStop.routeId],
        references: [route.id],
    }),
    distributions: many(distribution),
}));

/* Route Run */
export const routeRunRelations = relations(routeRun, ({ one, many }) => ({
    route: one(route, {
        fields: [routeRun.routeId],
        references: [route.id],
    }),
    van: one(van, {
        fields: [routeRun.vanId],
        references: [van.id],
    }),
    driver: one(driver, {
        fields: [routeRun.driverId],
        references: [driver.id],
    }),
    distributions: many(distribution),
}));

/* Distribution */
export const distributionRelations = relations(distribution, ({ one, many }) => ({
    homelessPerson: one(homelessPerson, {
        fields: [distribution.homelessPersonId],
        references: [homelessPerson.id],
    }),
    items: many(distributionItem),
    routeStop: one(routeStop, {
        fields: [distribution.routeStopId],
        references: [routeStop.id],
    }),
    routeRun: one(routeRun, {
        fields: [distribution.routeRunId],
        references: [routeRun.id],
    }),
}));

/* Distribution Item */
export const distributionItemRelations = relations(distributionItem, ({ one }) => ({
    distribution: one(distribution, {
        fields: [distributionItem.distributionId],
        references: [distribution.id],
    }),
    itemType: one(itemType, {
        fields: [distributionItem.itemTypeId],
        references: [itemType.id],
    }),
}));
