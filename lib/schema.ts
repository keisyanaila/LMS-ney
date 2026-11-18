
import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Role pengguna
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "kepala_sekolah",
  "kurikulum",
  "guru",
  "murid",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
]);

// Akun pengguna
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    username: varchar("username", { length: 50 }).notNull(),
    email: varchar("email", { length: 150 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    status: userStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    uniqueIndex("users_email_unique").on(table.email),
  ]
);

// Jurusan
export const majors = pgTable(
  "majors",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 150 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

// Tahun ajaran
export const academicYears = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 20 }).notNull().unique(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Guru
export const teachers = pgTable(
  "teachers",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    teacherNumber: varchar("teacher_number", { length: 50 }).unique(),
    subject: varchar("subject", { length: 150 }),
    phone: varchar("phone", { length: 30 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

// Kelas
export const classes = pgTable(
  "classes",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    majorId: integer("major_id")
      .notNull()
      .references(() => majors.id, { onDelete: "restrict" }),
    homeroomTeacherId: integer("homeroom_teacher_id")
      .references(() => teachers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

// Murid
export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    studentNumber: varchar("student_number", { length: 50 }).unique(),
    academicYear: varchar("academic_year", { length: 20 }),
    classId: integer("class_id")
      .references(() => classes.id, { onDelete: "set null" }),
    phone: varchar("phone", { length: 30 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

// Log aktivitas
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  userName: varchar("user_name", { length: 150 }),
  role: varchar("role", { length: 50 }),
  action: text("action").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
