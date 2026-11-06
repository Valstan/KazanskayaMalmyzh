import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "visitor_facts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"esa_sub" varchar NOT NULL,
  	"fact_key" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"source" varchar DEFAULT 'self' NOT NULL,
  	"verified_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "visitor_facts_id" integer;
  CREATE INDEX "visitor_facts_esa_sub_idx" ON "visitor_facts" USING btree ("esa_sub");
  CREATE INDEX "visitor_facts_fact_key_idx" ON "visitor_facts" USING btree ("fact_key");
  CREATE INDEX "visitor_facts_updated_at_idx" ON "visitor_facts" USING btree ("updated_at");
  CREATE INDEX "visitor_facts_created_at_idx" ON "visitor_facts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_visitor_facts_fk" FOREIGN KEY ("visitor_facts_id") REFERENCES "public"."visitor_facts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_visitor_facts_id_idx" ON "payload_locked_documents_rels" USING btree ("visitor_facts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "visitor_facts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "visitor_facts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_visitor_facts_fk";
  
  DROP INDEX "payload_locked_documents_rels_visitor_facts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "visitor_facts_id";`)
}
