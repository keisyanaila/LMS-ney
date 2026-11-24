// Membuat akun admin pertama.
// Pakai: npm run buat-admin -- <username> <email> <password> "<Nama Lengkap>"
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

config({ path: ".env.local" });

const [username, email, password, ...nameParts] = process.argv.slice(2);
const fullName = nameParts.join(" ") || "Administrator";

if (!username || !email || !password) {
  console.error(
    'Pakai: npm run buat-admin -- <username> <email> <password> "<Nama Lengkap>"'
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password minimal 8 karakter.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL belum diatur di .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const passwordHash = await hash(password, 10);

try {
  const rows = await sql`
    INSERT INTO users (full_name, username, email, password_hash, role, status, must_change_password)
    VALUES (${fullName}, ${username.toLowerCase()}, ${email.toLowerCase()}, ${passwordHash}, 'admin', 'active', false)
    RETURNING id`;
  console.log(`Admin dibuat (id ${rows[0].id}). Masuk di / dengan username "${username.toLowerCase()}".`);
} catch (error) {
  console.error("Gagal membuat admin:", error.message);
  process.exit(1);
}
