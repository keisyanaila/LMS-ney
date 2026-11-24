# Learnova Admin UI — Perbaikan

## Yang diubah
- Memuat Tailwind CSS v4 melalui `@import "tailwindcss";` di `app/globals.css`.
- Memperbarui latar panel admin, header, sidebar, dan hero halaman admin.
- Menggunakan maskot yang sudah tersedia di `public/learnova-mascot.png`.
- Merapikan tampilan kartu, filter, tabel akun, badge status, dan tombol aksi.

## Yang tidak diubah
- Skema dan koneksi database.
- Autentikasi dan otorisasi admin.
- Server actions untuk tambah, edit, reset password, nonaktifkan, dan hapus akun.
- Alur data dan fitur LMS lainnya.

## Menjalankan proyek
1. Ekstrak ZIP.
2. Jalankan `npm install`.
3. Siapkan file environment sesuai konfigurasi proyek.
4. Jalankan `npm run dev`.

Catatan: pemeriksaan TypeScript (`tsc --noEmit`) berhasil. Build Next.js belum dapat diverifikasi di lingkungan ini karena paket SWC Linux tidak tersedia dan koneksi jaringan untuk mengunduhnya dibatasi.
