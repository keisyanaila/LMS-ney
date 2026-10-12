import { getNavItem } from "@/lib/admin-nav";
import { Button, Card, Field, PageHeader } from "@/components/admin/ui";

export default function KonfigurasiSistemPage() {
  return (
    <>
      <PageHeader item={getNavItem("/admin/konfigurasi")} />

      <form className="space-y-6">
        <Card title="Identitas Sekolah">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Sekolah" name="schoolName" placeholder="SMK ..." />
            <Field label="NPSN" name="npsn" placeholder="12345678" />
            <Field label="Email Sekolah" name="schoolEmail" type="email" />
            <Field label="No. Telepon" name="schoolPhone" />
          </div>
        </Card>

        <Card title="Tahun Ajaran">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tahun Ajaran Aktif" name="academicYear" placeholder="2026/2027" />
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Semester Aktif</span>
              <select
                name="semester"
                className="w-full rounded-md border border-black/10 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </label>
          </div>
        </Card>

        <Card title="Pengaturan Sistem">
          <div className="space-y-3">
            {[
              { name: "allowRegistration", label: "Izinkan murid mendaftar sendiri" },
              { name: "maintenanceMode", label: "Mode perawatan (hanya admin yang bisa masuk)" },
              { name: "emailNotification", label: "Kirim notifikasi lewat email" },
            ].map((opt) => (
              <label key={opt.name} className="flex items-center gap-3 text-sm">
                <input type="checkbox" name={opt.name} className="h-4 w-4 accent-blue-600" />
                {opt.label}
              </label>
            ))}
          </div>
          <div className="mt-4 max-w-xs">
            <Field label="Batas ukuran unggahan (MB)" name="maxUploadMb" type="number" defaultValue="10" />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Simpan Konfigurasi</Button>
        </div>
      </form>
    </>
  );
}
