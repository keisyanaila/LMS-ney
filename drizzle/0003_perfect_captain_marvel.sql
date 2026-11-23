CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"teaching_class_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_weights" (
	"id" serial PRIMARY KEY NOT NULL,
	"teaching_class_id" integer NOT NULL,
	"kind" "assessment_kind" NOT NULL,
	"weight" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_teaching_class_id_teaching_classes_id_fk" FOREIGN KEY ("teaching_class_id") REFERENCES "public"."teaching_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_weights" ADD CONSTRAINT "grade_weights_teaching_class_id_teaching_classes_id_fk" FOREIGN KEY ("teaching_class_id") REFERENCES "public"."teaching_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "grade_weights_class_kind_unique" ON "grade_weights" USING btree ("teaching_class_id","kind");