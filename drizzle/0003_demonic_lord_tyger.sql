CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"mime_type" varchar(150) NOT NULL,
	"size" integer NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "file_id" integer;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "file_id" integer;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN "file_url";