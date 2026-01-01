// db/schema.ts
import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    numeric,
    boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ======================
   PEOPLE
====================== */

export const homelessPerson = pgTable("homeless_person", {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    ssnLast4Hash: text("ssn_last4_hash"),
    isIdentifiable: boolean("is_identifiable").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ======================
   INVENTORY
====================== */

export const itemCategory = pgTable("item_category", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
});

export const itemType = pgTable("item_type", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    itemCategoryId: uuid("item_category_id")
        .references(() => itemCategory.id)
        .notNull(),
});

/* ======================
   ROUTES
====================== */

export const route = pgTable("route", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
});

/* ======================
   ROUTE SCHEDULES
   (When each route runs - day of week and time)
====================== */

export const routeSchedule = pgTable("route_schedule", {
    id: uuid("id").primaryKey().defaultRandom(),
    routeId: uuid("route_id")
        .references(() => route.id)
        .notNull(),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
    startTime: text("start_time").notNull(), // e.g., "18:00"
});

/* ======================
   DISTRIBUTION SESSION
   (Active distribution when van is running)
====================== */

export const distributionSession = pgTable("distribution_session", {
    id: uuid("id").primaryKey().defaultRandom(),
    routeId: uuid("route_id")
        .references(() => route.id)
        .notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    currentStopId: uuid("current_stop_id")
        .references(() => routeStop.id),
    isActive: boolean("is_active").default(true).notNull(),
});

/* ======================
   VAN LOCATION
   (GPS tracking for vans during distribution)
====================== */

export const vanLocation = pgTable("van_location", {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
        .references(() => distributionSession.id)
        .notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
    longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
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
   DISTRIBUTION
   (Record for each service encounter)
====================== */

export const distribution = pgTable("distribution", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Person served (required)
    homelessPersonId: uuid("homeless_person_id")
        .references(() => homelessPerson.id)
        .notNull(),

    // Meal tracking
    mealServed: boolean("meal_served").default(false).notNull(),
    mealsTakeAway: integer("meals_take_away").default(0).notNull(),

    // GPS location (captured from device at check-in)
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),

    // Route/Stop association
    routeStopId: uuid("route_stop_id")
        .references(() => routeStop.id),

    // Timestamp
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

/* Item Category */
export const itemCategoryRelations = relations(itemCategory, ({ many }) => ({
    itemTypes: many(itemType),
}));

/* Item Type */
export const itemTypeRelations = relations(itemType, ({ one, many }) => ({
    category: one(itemCategory, {
        fields: [itemType.itemCategoryId],
        references: [itemCategory.id],
    }),
    distributionItems: many(distributionItem),
}));

/* Route */
export const routeRelations = relations(route, ({ many }) => ({
    stops: many(routeStop),
    schedules: many(routeSchedule),
    sessions: many(distributionSession),
}));

/* Route Schedule */
export const routeScheduleRelations = relations(routeSchedule, ({ one }) => ({
    route: one(route, {
        fields: [routeSchedule.routeId],
        references: [route.id],
    }),
}));

/* Distribution Session */
export const distributionSessionRelations = relations(distributionSession, ({ one, many }) => ({
    route: one(route, {
        fields: [distributionSession.routeId],
        references: [route.id],
    }),
    currentStop: one(routeStop, {
        fields: [distributionSession.currentStopId],
        references: [routeStop.id],
    }),
    locations: many(vanLocation),
}));

/* Van Location */
export const vanLocationRelations = relations(vanLocation, ({ one }) => ({
    session: one(distributionSession, {
        fields: [vanLocation.sessionId],
        references: [distributionSession.id],
    }),
}));

/* Route Stop */
export const routeStopRelations = relations(routeStop, ({ one, many }) => ({
    route: one(route, {
        fields: [routeStop.routeId],
        references: [route.id],
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
