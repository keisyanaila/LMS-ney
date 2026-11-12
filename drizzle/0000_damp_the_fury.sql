CREATE TYPE "public"."user_role" AS ENUM('admin', 'kepala_sekolah', 'kurikulum', 'guru', 'murid');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_name" varchar(150),
	"role" varchar(50),
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"major_id" integer NOT NULL,
	"homeroom_teacher_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "majors" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "majors_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"student_number" varchar(50),
	"class_id" integer,
	"phone" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "students_student_number_unique" UNIQUE("student_number")
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"teacher_number" varchar(50),
	"subject" varchar(150),
	"phone" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teachers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "teachers_teacher_number_unique" UNIQUE("teacher_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_major_id_majors_id_fk" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_homeroom_teacher_id_teachers_id_fk" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");