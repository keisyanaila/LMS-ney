import { getNavItem } from "@/lib/admin-nav";
import { Button, Card, Field, PageHeader } from "@/components/admin/ui";

export default function ProfilSayaPage() {
  return (
    <>
      <PageHeader item={getNavItem("/admin/profil")} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-4xl font-semibold text-white">
            A
          </div>
          <h2 className="mt-4 text-lg font-semibold">Administrator</h2>
          <p className="text-sm text-black/50">Admin</p>
          <div className="mt-4">
            <Button variant="secondary">Ganti Foto</Button>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Informasi Akun">
            <form className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nama Lengkap" name="name" />
                <Field label="Username" name="username" />
                <Field label="Email" name="email" type="email" />
                <Field label="No. HP" name="phone" />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Simpan Profil</Button>
              </div>
            </form>
          </Card>

          <Card title="Ubah Kata Sandi">
            <form className="space-y-4">
              <Field label="Kata Sandi Saat Ini" name="currentPassword" type="password" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Kata Sandi Baru" name="newPassword" type="password" />
                <Field label="Konfirmasi Kata Sandi" name="confirmPassword" type="password" />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Ubah Kata Sandi</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
