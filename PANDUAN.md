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

Tiap kelas ajar punya tab terpisah: Ringkasan, Pengumuman, Materi, Tugas,
Kuis, Ujian, Penilaian, Kehadiran.

| Rute | Fungsi |
| --- | --- |
| `/guru` | Dashboard: kelas, murid, menunggu dinilai, tenggat |
| `/guru/kelas` | Tambah kelas ajar (kelas + mata pelajaran) |
| `/guru/kelas/[id]` | Ringkasan: perlu dinilai, tenggat, pengumuman, daftar murid |
| `.../pengumuman` | Kirim/hapus pengumuman |
| `.../materi` | Tambah/edit/hapus materi (teks, link, file) |
| `.../tugas` | Buat/edit/hapus tugas, lihat jumlah terkumpul dan dinilai |
| `.../kuis` dan `.../ujian` | Buat kuis atau UTS/UAS online (jadwal, durasi), daftar dan status |
| `.../kuis/[aid]` | Hasil siswa, terbitkan, rilis nilai, reset pengerjaan |
| `.../kuis/[aid]/soal` | Tambah/edit/hapus soal (pilihan ganda atau esai) |
| `.../kuis/[aid]/koreksi/[sid]` | Lihat jawaban siswa dan nilai esai |
| `.../penilaian` | Rekap semua nilai, bobot nilai akhir, penilaian praktik, unduh Excel |
| `.../kehadiran` | Buat pertemuan, rekap kehadiran, unduh Excel |

(`/ujian/...` sama seperti `/kuis/...`.)

Alur kuis/ujian: buat (otomatis berstatus Draf) -> tambah soal -> Terbitkan ->
siswa mengerjakan -> pilihan ganda dinilai otomatis, esai dikoreksi guru ->
Rilis nilai ke siswa. Soal terkunci setelah ada siswa yang mulai mengerjakan
(Reset pengerjaan siswa jika soal perlu diubah).

Nilai akhir: tanpa bobot = rata-rata persentase semua item. Dengan bobot
(total 100) = rata-rata tiap jenis dikali bobotnya; jenis yang belum punya
nilai tidak ikut dihitung.

## Panel siswa (`/siswa`)

Tiap mata pelajaran punya tab terpisah: Pengumuman, Materi, Tugas, Kuis,
Ujian, Nilai, Kehadiran.

| Rute | Fungsi |
| --- | --- |
| `/siswa` | Yang perlu dikerjakan (tugas, kuis, ujian), pengumuman, mata pelajaran |
| `/siswa/kelas` | Daftar mata pelajaran kelasnya |
| `/siswa/kelas/[id]` | Pengumuman guru |
| `.../materi` | Materi, unduh file, buka link |
| `.../tugas` dan `.../tugas/[aid]` | Daftar tugas dan kumpul tugas (teks, link, file) |
| `.../kuis` dan `.../ujian` | Daftar kuis/ujian beserta statusnya |
| `.../kuis/[aid]` | Info, tombol Mulai, hasil dan pembahasan (jika dirilis) |
| `.../kuis/[aid]/kerjakan` | Halaman mengerjakan dengan timer dan simpan otomatis |
| `.../nilai` | Nilai per penilaian, catatan guru, nilai akhir |
| `.../kehadiran` | Riwayat dan persentase kehadiran |

Aturan kuis/ujian: satu kesempatan per siswa. Timer berjalan di server
(durasi atau waktu tutup, mana yang lebih awal) dan terkirim otomatis saat
habis. Jawaban tersimpan otomatis tiap beberapa detik. Nilai dan pembahasan
baru terlihat setelah guru merilisnya.

Aturan tugas: boleh dikumpulkan ulang selama belum dinilai. Setelah tenggat
tetap bisa dikumpulkan tetapi ditandai terlambat. Setelah dinilai, terkunci.

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
- **Anti-curang terbatas:** halaman ujian tidak mengunci layar atau mendeteksi
  pindah tab, dan urutan soal tidak diacak. Soal dikirim tanpa kunci jawaban
  dan pengawasan berbasis waktu dilakukan di server, tetapi ini belum cocok
  untuk ujian dengan taruhan tinggi tanpa pengawasan.
- **Keamanan:** `proxy.ts` hanya pemeriksaan awal. Otorisasi sebenarnya ada di
  `requireTeacher()`, `requireStudent()`, dan pengecekan kepemilikan kelas
  di setiap query. Panel `/admin` sekarang wajib login sebagai admin (`requireAdmin()`).
  Akun admin pertama dibuat dengan `npm run buat-admin`.

## Portal siswa (`/siswa`)

Menu sidebar: Dashboard, Jadwal Pelajaran, Materi, Kuis, Ujian. Tugas, nilai, dan
kehadiran per mata pelajaran tetap ada di `/siswa/kelas/[id]` (dibuka dari kartu
"Progress per mata pelajaran" di Dashboard).

- **Data asli:** mata pelajaran, guru, materi, kuis, ujian, tugas, nilai, aktivitas,
  dan progress (kuis + ujian + tugas yang selesai dibanding semuanya).
- **Jadwal pelajaran masih contoh.** Belum ada tabel jadwal; `lib/jadwal.ts`
  menyusun hari, jam, dan ruang otomatis dari mata pelajaran siswa. Ganti
  `buildSchedule()` dengan query database saat tabel jadwal dibuat.
- **Status materi "sudah dibaca"** disimpan di browser siswa (localStorage),
  bukan di database, jadi tidak ikut pindah perangkat.
- **Video:** materi dengan tautan YouTube/Vimeo/.mp4 otomatis berlabel video.
