CREATE TABLE "distribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"homeless_person_id" uuid NOT NULL,
	"meal_served" boolean DEFAULT false NOT NULL,
	"meals_take_away" integer DEFAULT 0 NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"route_stop_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distribution_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"distribution_id" uuid NOT NULL,
	"item_type_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distribution_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"current_stop_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homeless_person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"ssn_last4_hash" text,
	"is_identifiable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "item_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"item_category_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_stop" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"stop_number" integer NOT NULL,
	"name" text NOT NULL,
	"location_description" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "van_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "distribution" ADD CONSTRAINT "distribution_homeless_person_id_homeless_person_id_fk" FOREIGN KEY ("homeless_person_id") REFERENCES "public"."homeless_person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution" ADD CONSTRAINT "distribution_route_stop_id_route_stop_id_fk" FOREIGN KEY ("route_stop_id") REFERENCES "public"."route_stop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_item" ADD CONSTRAINT "distribution_item_distribution_id_distribution_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."distribution"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_item" ADD CONSTRAINT "distribution_item_item_type_id_item_type_id_fk" FOREIGN KEY ("item_type_id") REFERENCES "public"."item_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_session" ADD CONSTRAINT "distribution_session_route_id_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."route"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_session" ADD CONSTRAINT "distribution_session_current_stop_id_route_stop_id_fk" FOREIGN KEY ("current_stop_id") REFERENCES "public"."route_stop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_type" ADD CONSTRAINT "item_type_item_category_id_item_category_id_fk" FOREIGN KEY ("item_category_id") REFERENCES "public"."item_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_schedule" ADD CONSTRAINT "route_schedule_route_id_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."route"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stop" ADD CONSTRAINT "route_stop_route_id_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."route"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "van_location" ADD CONSTRAINT "van_location_session_id_distribution_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."distribution_session"("id") ON DELETE no action ON UPDATE no action;