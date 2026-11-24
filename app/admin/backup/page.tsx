import { getNavItem } from "@/lib/admin-nav";
import { Button, Card, PageHeader } from "@/components/admin/ui";

export default function BackupPemulihanPage() {
  return (
    <>
      <PageHeader item={getNavItem("/admin/backup")} />

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <b>Fitur ini belum aktif.</b> Tombol di bawah sengaja dinonaktifkan
        supaya tidak menimbulkan salah paham. Sementara itu, data tersimpan di
        Neon PostgreSQL yang menyediakan cadangan dan pemulihan dari dashboard
        Neon. Untuk salinan data per tabel, pakai menu{" "}
        <b>Ekspor Data</b>.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Buat backup">
          <p className="mb-4 text-sm text-black/55">
            Cadangkan seluruh data LMS (akun, guru, murid, kelas, dan log) ke
            satu file.
          </p>
          <Button disabled>Backup sekarang</Button>
        </Card>

        <Card title="Pulihkan data">
          <p className="mb-4 text-sm text-black/55">
            Unggah file backup untuk memulihkan data. Data yang ada sekarang
            akan ditimpa.
          </p>
          <Button variant="danger" disabled>
            Pulihkan
          </Button>
        </Card>
      </div>
    </>
  );
}
