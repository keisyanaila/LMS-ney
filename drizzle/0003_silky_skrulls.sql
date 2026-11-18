CREATE TYPE "public"."assessment_kind" AS ENUM('tugas', 'kuis', 'uts', 'uas', 'praktik');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('hadir', 'izin', 'sakit', 'alpa');--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"teaching_class_id" integer NOT NULL,
	"kind" "assessment_kind" DEFAULT 'tugas' NOT NULL,
	"title" varchar(200) NOT NULL,
	"instructions" text,
	"due_at" timestamp,
	"max_score" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"status" "attendance_status" DEFAULT 'hadir' NOT NULL,
	"note" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"teaching_class_id" integer NOT NULL,
	"meeting_date" date NOT NULL,
	"topic" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"teaching_class_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"link_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"answer" text,
	"link_url" text,
	"submitted_at" timestamp,
	"score" numeric(5, 2),
	"feedback" text,
	"graded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "teaching_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"class_id" integer NOT NULL,
	"subject" varchar(150) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_teaching_class_id_teaching_classes_id_fk" FOREIGN KEY ("teaching_class_id") REFERENCES "public"."teaching_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_attendance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_teaching_class_id_teaching_classes_id_fk" FOREIGN KEY ("teaching_class_id") REFERENCES "public"."teaching_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_teaching_class_id_teaching_classes_id_fk" FOREIGN KEY ("teaching_class_id") REFERENCES "public"."teaching_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_classes" ADD CONSTRAINT "teaching_classes_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_classes" ADD CONSTRAINT "teaching_classes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_records_session_student_unique" ON "attendance_records" USING btree ("session_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_sessions_class_date_unique" ON "attendance_sessions" USING btree ("teaching_class_id","meeting_date");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_assessment_student_unique" ON "submissions" USING btree ("assessment_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teaching_classes_unique" ON "teaching_classes" USING btree ("teacher_id","class_id","subject");