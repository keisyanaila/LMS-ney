import Link from "next/link";
import { getNavItem } from "@/lib/admin-nav";
import { listClassesWithCounts, listDocs } from "@/lib/admin-data";
import {
  Card,
  DataTable,
  ErrorNotice,
  PageHeader,
} from "@/components/admin/ui";
import { deleteClass, deleteMajor } from "./actions";
import DeleteButton from "@/components/admin/DeleteButton";
import { ClassForm, EditClassButton, MajorForm } from "./forms";

export default async function KelasPage() {
  const [classes, majors, teachers] = await Promise.all([
    listClassesWithCounts(),
    listDocs("majors", 200),
    listDocs("teachers", 500),
  ]);

  const usedMajors = new Set(
    classes.ok ? classes.data.map((item) => item.majorId) : []
  );

  const majorOptions = majors.ok
    ? majors.data.map((major) => ({
        id: Number(major.id),
        code: String(major.code),
        name: String(major.name),
      }))
    : [];

  const teacherOptions = teachers.ok
    ? teachers.data.map((teacher) => ({
        id: Number(teacher.id),
        fullName: String(teacher.fullName),
      }))
    : [];

  const classById = new Map(
    (classes.ok ? classes.data : []).map((item) => [item.id, item])
  );

  return (
    <>
      <PageHeader item={getNavItem("/admin/kelas")} />

      <div className="space-y-6">
        <Card title="Daftar Kelas">
          {classes.ok && majors.ok && teachers.ok ? (
            <>
              <ClassForm majors={majorOptions} teachers={teacherOptions} />

              <DataTable
                columns={[
                  {
                    key: "name",
                    label: "Kelas",
                    render: (row) => (
                      <Link
                        href={`/admin/kelas/${row.id}`}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {String(row.name)}
                      </Link>
                    ),
                  },
                  { key: "major", label: "Jurusan" },
                  { key: "homeroomTeacher", label: "Wali Kelas" },
                  { key: "studentCount", label: "Jumlah Murid" },
                ]}
                rows={classes.data}
                emptyText="Belum ada kelas."
                rowActions={(row) => {
                  const item = classById.get(Number(row.id));

                  if (!item) return null;

                  return (
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/kelas/${item.id}`}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        Lihat
                      </Link>

                      <EditClassButton
                        cls={{
                          id: item.id,
                          name: item.name,
                          majorId: item.majorId,
                          homeroomTeacherId: item.homeroomTeacherId,
                        }}
                        majors={majorOptions}
                        teachers={teacherOptions}
                      />

                      <DeleteButton
                        action={deleteClass.bind(null, String(item.id))}
                        label={`kelas ${item.name}`}
                        warning={
                          item.studentCount > 0
                            ? `${item.studentCount} murid di kelas ini tidak ikut terhapus, tetapi akan menjadi belum punya kelas.`
                            : undefined
                        }
                      />
                    </div>
                  );
                }}
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

        <Card title="Jurusan">
          <p className="mb-4 text-sm text-black/50">
            Setiap kelas harus punya jurusan. Tambahkan jurusan di sini sebelum
            membuat kelas.
          </p>

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
                    <span className="text-xs text-black/40">Dipakai</span>
                  ) : (
                    <DeleteButton
                      action={deleteMajor.bind(null, String(row.id))}
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
      </div>
    </>
  );
}
