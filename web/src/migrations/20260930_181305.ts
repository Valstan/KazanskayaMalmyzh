import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "visitors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"esa_sub" varchar NOT NULL,
  	"display_name" varchar,
  	"contacts_email" varchar,
  	"contacts_phone" varchar,
  	"subscribed" boolean DEFAULT false,
  	"unsubscribed_at" timestamp(3) with time zone,
  	"last_seen_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "visitors_id" integer;
  CREATE UNIQUE INDEX "visitors_esa_sub_idx" ON "visitors" USING btree ("esa_sub");
  CREATE INDEX "visitors_updated_at_idx" ON "visitors" USING btree ("updated_at");
  CREATE INDEX "visitors_created_at_idx" ON "visitors" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_visitors_fk" FOREIGN KEY ("visitors_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_visitors_id_idx" ON "payload_locked_documents_rels" USING btree ("visitors_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "visitors" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "visitors" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_visitors_fk";
  
  DROP INDEX "payload_locked_documents_rels_visitors_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "visitors_id";`)
}
