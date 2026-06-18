CREATE TABLE "ms_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ms_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"event_date" timestamp with time zone NOT NULL,
	"city" varchar(100),
	"event_type" varchar(30),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(100),
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" varchar(100),
	"deleted_at" timestamp with time zone,
	"deleted_by" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(20) NOT NULL,
	"expired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(100),
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" varchar(100),
	"deleted_at" timestamp with time zone,
	"deleted_by" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar(255) NOT NULL,
	"order_id" integer NOT NULL,
	"ticket_tier_id" integer NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(100),
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" varchar(100),
	"deleted_at" timestamp with time zone,
	"deleted_by" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "ticket_tiers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ticket_tiers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar(255) NOT NULL,
	"event_id" integer NOT NULL,
	"tier_name" varchar(50) NOT NULL,
	"price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_capacity" integer NOT NULL,
	"available_stock" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(100),
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" varchar(100),
	"deleted_at" timestamp with time zone,
	"deleted_by" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"username" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(100),
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" varchar(100),
	"deleted_at" timestamp with time zone,
	"deleted_by" varchar(100),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_ticket_tier_id_ticket_tiers_id_fk" FOREIGN KEY ("ticket_tier_id") REFERENCES "public"."ticket_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_tiers" ADD CONSTRAINT "ticket_tiers_event_id_ms_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."ms_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_ticket_tier_id_idx" ON "order_items" USING btree ("ticket_tier_id");--> statement-breakpoint
CREATE INDEX "ticket_tiers_event_id_idx" ON "ticket_tiers" USING btree ("event_id");