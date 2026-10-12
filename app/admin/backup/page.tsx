import { getNavItem } from "@/lib/admin-nav";
import { Button, Card, PageHeader } from "@/components/admin/ui";

export default function BackupPemulihanPage() {
  return (
    <>
      <PageHeader item={getNavItem("/admin/backup")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Buat Backup">
          <p className="mb-4 text-sm text-black/50">
            Cadangkan seluruh data LMS (akun, guru, murid, kelas, dan log) ke
            satu file.
          </p>
          <label className="mb-4 flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-blue-600" />
            Backup otomatis setiap hari pukul 00.00
          </label>
          <Button>Backup Sekarang</Button>
        </Card>

        <Card title="Pulihkan Data">
          <p className="mb-4 text-sm text-black/50">
            Unggah file backup untuk memulihkan data.{" "}
            <b className="text-red-600">
              Data yang ada sekarang akan ditimpa.
            </b>
          </p>
          <input
            type="file"
            accept=".json,.gz"
            className="mb-4 block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-bold file:text-blue-700"
          />
          <Button variant="danger">Pulihkan</Button>
        </Card>
      </div>

      <Card title="Riwayat Backup" className="mt-6">
        <div className="rounded-md border border-dashed border-black/10 p-10 text-center text-sm text-black/50">
          Belum ada backup.
        </div>
      </Card>
    </>
  );
}
