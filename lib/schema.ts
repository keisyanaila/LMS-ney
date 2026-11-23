
import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  date,
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
    // true bila password masih sementara dari admin; wajib diganti saat login.
    mustChangePassword: boolean("must_change_password").default(false).notNull(),
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

// ---------------------------------------------------------------------------
// Modul guru: kelas ajar, materi, tugas/penilaian, kehadiran
// ---------------------------------------------------------------------------

export const assessmentKindEnum = pgEnum("assessment_kind", [
  "tugas",
  "kuis",
  "uts",
  "uas",
  "praktik",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "hadir",
  "izin",
  "sakit",
  "alpa",
]);

// Kelas ajar: satu guru mengajar satu mata pelajaran di satu kelas (rombel).
export const teachingClasses = pgTable(
  "teaching_classes",
  {
    id: serial("id").primaryKey(),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: integer("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 150 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("teaching_classes_unique").on(
      table.teacherId,
      table.classId,
      table.subject
    ),
  ]
);

// Materi pembelajaran
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  teachingClassId: integer("teaching_class_id")
    .notNull()
    .references(() => teachingClasses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  linkUrl: text("link_url"),
  fileId: integer("file_id").references(() => files.id, {
    onDelete: "set null",
  }),
  fileName: varchar("file_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Item penilaian: tugas, kuis, UTS, UAS, praktik
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  teachingClassId: integer("teaching_class_id")
    .notNull()
    .references(() => teachingClasses.id, { onDelete: "cascade" }),
  kind: assessmentKindEnum("kind").default("tugas").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  instructions: text("instructions"),
  dueAt: timestamp("due_at"),
  maxScore: integer("max_score").default(100).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pengumpulan dan nilai murid untuk satu item penilaian
export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    assessmentId: integer("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    answer: text("answer"),
    linkUrl: text("link_url"),
    fileId: integer("file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    fileName: varchar("file_name", { length: 255 }),
    submittedAt: timestamp("submitted_at"),
    score: numeric("score", { precision: 5, scale: 2, mode: "number" }),
    feedback: text("feedback"),
    gradedAt: timestamp("graded_at"),
  },
  (table) => [
    uniqueIndex("submissions_assessment_student_unique").on(
      table.assessmentId,
      table.studentId
    ),
  ]
);

// Pertemuan (sesi absensi)
export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: serial("id").primaryKey(),
    teachingClassId: integer("teaching_class_id")
      .notNull()
      .references(() => teachingClasses.id, { onDelete: "cascade" }),
    meetingDate: date("meeting_date", { mode: "string" }).notNull(),
    topic: varchar("topic", { length: 200 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("attendance_sessions_class_date_unique").on(
      table.teachingClassId,
      table.meetingDate
    ),
  ]
);

// Kehadiran murid per pertemuan
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: "cascade" }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").default("hadir").notNull(),
    note: varchar("note", { length: 200 }),
  },
  (table) => [
    uniqueIndex("attendance_records_session_student_unique").on(
      table.sessionId,
      table.studentId
    ),
  ]
);

// Pengumuman kelas dari guru
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  teachingClassId: integer("teaching_class_id")
    .notNull()
    .references(() => teachingClasses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bobot nilai akhir per jenis penilaian (total 100) untuk satu kelas ajar
export const gradeWeights = pgTable(
  "grade_weights",
  {
    id: serial("id").primaryKey(),
    teachingClassId: integer("teaching_class_id")
      .notNull()
      .references(() => teachingClasses.id, { onDelete: "cascade" }),
    kind: assessmentKindEnum("kind").notNull(),
    weight: integer("weight").notNull(),
  },
  (table) => [
    uniqueIndex("grade_weights_class_kind_unique").on(
      table.teachingClassId,
      table.kind
    ),
  ]
);

// File unggahan (materi guru dan tugas siswa), disimpan di database.
// Isi file berupa base64 agar kompatibel dengan driver Neon HTTP.
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 150 }).notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
