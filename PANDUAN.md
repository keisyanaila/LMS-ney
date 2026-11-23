# Panduan Modul Guru dan Siswa

## Langkah setelah menimpa file

1. Tambahkan ke `.env.local` (lihat `.env.example`):
   ```
   SESSION_SECRET=<hasil: openssl rand -base64 32>
   ```
   Tidak perlu layanan penyimpanan tambahan: file disimpan di database Neon.
2. Buat dan jalankan migrasi untuk tabel dan kolom baru:
   ```
   npm run db:generate
   npm run db:migrate
   ```
3. Wajibkan siswa yang sudah ada mengganti password saat login berikutnya
   (jalankan sekali di SQL editor Neon):
   ```sql
   UPDATE users SET must_change_password = true WHERE role = 'murid';
   ```
   Akun siswa dan guru yang dibuat setelah ini otomatis wajib ganti password.
4. `npm run dev`.

## Alur login

- Login dari halaman depan (`/`) memakai email atau username.
- Akun baru (murid/guru) dan akun yang password-nya direset admin akan
  diarahkan ke `/ganti-password` dan baru bisa masuk setelah membuat password
  sendiri (minimal 8 karakter).
- Setelah itu password bisa diganti kapan saja lewat menu "Ganti password"
  di sidebar (meminta password saat ini).
- Peran guru masuk ke `/guru`, murid ke `/siswa`, admin ke `/admin`.

## Panel guru (`/guru`)

| Rute | Fungsi |
| --- | --- |
| `/guru` | Dashboard: kelas, murid, menunggu dinilai, tenggat |
| `/guru/kelas` | Tambah kelas ajar (kelas + mata pelajaran) |
| `/guru/kelas/[id]` | Ringkasan: perlu dinilai, tenggat, pengumuman, daftar murid |
| `.../pengumuman` | Kirim/hapus pengumuman |
| `.../materi` | Tambah/edit/hapus materi (teks, link, file) |
| `.../tugas` | Buat/edit/hapus tugas, lihat jumlah terkumpul dan dinilai |
| `.../penilaian` | Rekap nilai, bobot nilai akhir, kuis/UTS/UAS/praktik, unduh Excel |
| `.../penilaian/[aid]` | Lihat jawaban/file murid, beri nilai dan catatan |
| `.../kehadiran` | Buat pertemuan, rekap kehadiran, unduh Excel |

Nilai akhir: tanpa bobot = rata-rata persentase semua item. Dengan bobot
(total 100) = rata-rata tiap jenis dikali bobotnya; jenis yang belum punya
nilai tidak ikut dihitung.

## Panel siswa (`/siswa`)

| Rute | Fungsi |
| --- | --- |
| `/siswa` | Tugas belum dikumpulkan, pengumuman terbaru, mata pelajaran |
| `/siswa/kelas` | Daftar mata pelajaran kelasnya |
| `/siswa/kelas/[id]` | Pengumuman guru |
| `.../materi` | Materi, unduh file, buka link |
| `.../tugas` dan `.../tugas/[aid]` | Daftar tugas dan kumpul tugas (teks, link, file) |
| `.../nilai` | Nilai per penilaian, catatan guru, nilai akhir |
| `.../kehadiran` | Riwayat dan persentase kehadiran |

Aturan pengumpulan: boleh dikumpulkan ulang selama belum dinilai. Setelah
terlambat tetap bisa dikumpulkan, tetapi ditandai terlambat. Setelah dinilai,
pengumpulan terkunci.

## Hal yang perlu diketahui

- **File disimpan di database Neon** (tabel `files`, isi dalam base64). File
  bersifat **privat**: dibuka lewat `/api/files/[id]` yang memeriksa login.
  File materi hanya bisa dibuka guru pemilik kelas dan murid di kelas itu.
  File tugas hanya bisa dibuka murid pemiliknya dan guru kelas itu.
- **Ukuran database:** file ikut memakai kuota Neon (base64 membuatnya sekitar
  sepertiga lebih besar). Cocok untuk uji coba atau tugas sekolah. Jika nanti
  dipakai banyak kelas, pertimbangkan pindah ke Cloudflare R2 atau Supabase
  Storage; semua kodenya ada di `lib/storage.ts` dan `lib/file-access.ts`.
- **Batas file:** 4 MB per file (batas request Vercel sekitar 4,5 MB).
  Tipe: pdf, doc(x), ppt(x), xls(x), txt, jpg, png, zip.
- **Keamanan:** `proxy.ts` hanya pemeriksaan awal. Otorisasi sebenarnya ada di
  `requireTeacher()`, `requireStudent()`, dan pengecekan kepemilikan kelas
  di setiap query. Panel `/admin` belum dilindungi login (sama seperti dulu).
