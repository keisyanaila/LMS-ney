import { getNavItem } from "@/lib/admin-nav";
import { listAcademicYears } from "@/lib/admin-data";
import {
  Badge,
  Card,
  DataTable,
  ErrorNotice,
  PageHeader,
} from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteAcademicYear } from "./actions";
import { EditYearButton, SetActiveButton, YearForm } from "./forms";

export default async function TahunAjaranPage() {
  const years = await listAcademicYears();

  const active = years.ok ? years.data.find((year) => year.isActive) : null;

  return (
    <>
      <PageHeader item={getNavItem("/admin/tahun-ajaran")} />

      <div className="space-y-6">
        {years.ok && (
          <Card title="Tahun Ajaran Aktif">
            {active ? (
              <p className="text-2xl font-bold">{active.name}</p>
            ) : (
              <p className="text-sm text-black/50">
                Belum ada tahun ajaran aktif. Tambahkan atau aktifkan salah
                satu di bawah.
              </p>
            )}
          </Card>
        )}

        <Card title="Daftar Tahun Ajaran">
          {years.ok ? (
            <>
              <YearForm />

              <DataTable
                columns={[
                  { key: "name", label: "Tahun Ajaran" },
                  {
                    key: "isActive",
                    label: "Status",
                    render: (row) =>
                      row.isActive ? (
                        <Badge tone="green">Aktif</Badge>
                      ) : (
                        <Badge tone="gray">Tidak aktif</Badge>
                      ),
                  },
                  { key: "studentCount", label: "Jumlah Murid" },
                ]}
                rows={years.data}
                emptyText="Belum ada tahun ajaran."
                rowActions={(row) => {
                  const id = Number(row.id);
                  const name = String(row.name);
                  const isActive = row.isActive === true;
                  const inUse = Number(row.studentCount) > 0;

                  return (
                    <div className="flex items-center justify-end gap-4">
                      {!isActive && <SetActiveButton id={id} name={name} />}

                      <EditYearButton id={id} name={name} />

                      {isActive || inUse ? (
                        <span className="text-xs text-black/40">
                          {isActive ? "Sedang aktif" : "Dipakai"}
                        </span>
                      ) : (
                        <DeleteButton
                          action={deleteAcademicYear.bind(null, String(id))}
                          label={`tahun ajaran ${name}`}
                        />
                      )}
                    </div>
                  );
                }}
              />
            </>
          ) : (
            <ErrorNotice message={years.error} />
          )}
        </Card>
      </div>
    </>
  );
}
