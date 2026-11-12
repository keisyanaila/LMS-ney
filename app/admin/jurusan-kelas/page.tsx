
import { getNavItem } from "@/lib/admin-nav";
import { listDocs } from "@/lib/admin-data";
import {
  Card,
  DataTable,
  ErrorNotice,
  PageHeader,
} from "@/components/admin/ui";
import {
  deleteClass,
  deleteMajor,
} from "./actions";
import {
  ClassForm,
  DeleteButton,
  MajorForm,
} from "./forms";

export default async function JurusanKelasPage() {
  const [majors, classes, teachers] = await Promise.all([
    listDocs("majors", 200),
    listDocs("classes", 200),
    listDocs("teachers", 200),
  ]);

  const usedMajors = new Set(
    classes.ok
      ? classes.data.map((item) => Number(item.majorId))
      : []
  );

  return (
    <>
      <PageHeader item={getNavItem("/admin/jurusan-kelas")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Jurusan">
          {majors.ok ? (
            <>
              <MajorForm />

              <DataTable
                columns={[
                  { key: "code", label: "Kode" },
                  { key: "name", label: "Nama Jurusan" },
                ]}
                rows={majors.data}
                emptyText="Belum ada jurusan."
                rowActions={(row) =>
                  usedMajors.has(Number(row.id)) ? (
                    <span className="text-xs text-black/40">
                      Dipakai
                    </span>
                  ) : (
                    <DeleteButton
                      action={deleteMajor.bind(
                        null,
                        String(row.id)
                      )}
                      label={`jurusan ${String(row.code)}`}
                    />
                  )
                }
              />
            </>
          ) : (
            <ErrorNotice message={majors.error} />
          )}
        </Card>

        <Card title="Kelas">
          {classes.ok && majors.ok && teachers.ok ? (
            <>
              <ClassForm
                majors={majors.data.map((major) => ({
                  id: Number(major.id),
                  code: String(major.code),
                  name: String(major.name),
                }))}
                teachers={teachers.data.map((teacher) => ({
                  id: Number(teacher.id),
                  fullName: String(teacher.fullName),
                }))}
              />

              <DataTable
                columns={[
                  { key: "name", label: "Kelas" },
                  { key: "major", label: "Jurusan" },
                  {
                    key: "homeroomTeacher",
                    label: "Wali Kelas",
                  },
                ]}
                rows={classes.data}
                emptyText="Belum ada kelas."
                rowActions={(row) => (
                  <DeleteButton
                    action={deleteClass.bind(
                      null,
                      String(row.id)
                    )}
                    label={`kelas ${String(row.name)}`}
                  />
                )}
              />
            </>
          ) : (
            <ErrorNotice
              message={
                !classes.ok
                  ? classes.error
                  : !majors.ok
                    ? majors.error
                    : !teachers.ok
                      ? teachers.error
                      : "Gagal memuat data."
              }
            />
          )}
        </Card>
      </div>
    </>
  );
}
