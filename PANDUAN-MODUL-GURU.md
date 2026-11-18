# Modul Guru

## Langkah setelah menimpa file

1. Tambahkan ke `.env.local`:
   ```
   SESSION_SECRET=<hasil: openssl rand -base64 32>
   ```
2. Buat dan jalankan migrasi untuk tabel baru:
   ```
   npm run db:generate
   npm run db:migrate
   ```
   (atau `npm run db:push` untuk langsung menyinkronkan skema).
3. `npm run dev`, lalu masuk di halaman depan (`/`) dengan akun berperan **guru**.

## Rute

| Rute | Fungsi |
| --- | --- |
| `/guru` | Dashboard: jumlah kelas, murid, tenggat terdekat |
| `/guru/kelas` | Daftar dan tambah kelas ajar (kelas + mata pelajaran) |
| `/guru/kelas/[id]` | Ringkasan kelas, daftar murid, hapus kelas ajar |
| `/guru/kelas/[id]/materi` | Tambah/hapus materi (teks + link) |
| `/guru/kelas/[id]/tugas` | Buat/hapus tugas dengan tenggat |
| `/guru/kelas/[id]/penilaian` | Rekap nilai semua murid, tambah kuis/UTS/UAS/praktik |
| `/guru/kelas/[id]/penilaian/[aid]` | Input nilai dan catatan per murid |
| `/guru/kelas/[id]/kehadiran` | Daftar pertemuan, rekap kehadiran per murid |
| `/guru/kelas/[id]/kehadiran/[sid]` | Absensi satu pertemuan |

## Tabel baru

`teaching_classes`, `materials`, `assessments`, `submissions`,
`attendance_sessions`, `attendance_records`.

## Keamanan

- Login memakai cookie sesi bertanda tangan (jose, HttpOnly, 7 hari).
- `proxy.ts` hanya pemeriksaan awal. Otorisasi sebenarnya ada di
  `requireTeacher()` dan `getOwnedTeachingClass()`, sehingga guru hanya bisa
  mengakses kelas ajar miliknya sendiri.
- Panel `/admin` belum dilindungi login (sama seperti sebelumnya).
