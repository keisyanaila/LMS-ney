import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassDetail, listDocs } from "@/lib/admin-data";
import {
  Badge,
  Card,
  DataTable,
  ErrorNotice,
  PageHeader,
} from "@/components/admin/ui";
import { deleteClass } from "../actions";
import DeleteButton from "@/components/admin/DeleteButton";
import { EditClassButton } from "../forms";

const backLink = (
  <Link
    href="/admin/kelas"
    className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
  >
    &larr; Kembali ke daftar kelas
  </Link>
);

export default async function DetailKelasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId) || classId <= 0) notFound();

  const [detail, majors, teachers] = await Promise.all([
    getClassDetail(classId),
    listDocs("majors", 200),
    listDocs("teachers", 500),
  ]);

  if (!detail.ok) {
    return (
      <>
        {backLink}
        <ErrorNotice message={detail.error} />
      </>
    );
  }

  const kelas = detail.data;

  if (!kelas) notFound();

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

  const total = kelas.students.length;

  const info: { label: string; value: string }[] = [
    { label: "Nama kelas", value: kelas.name },
    { label: "Jurusan", value: `${kelas.majorCode} - ${kelas.major}` },
    {
      label: "Wali kelas",
      value: kelas.homeroomTeacher
        ? `${kelas.homeroomTeacher}${
            kelas.homeroomTeacherNumber
              ? ` (${kelas.homeroomTeacherNumber})`
              : ""
          }`
        : "Belum ada wali kelas",
    },
    { label: "Jumlah murid", value: String(total) },
    {
      label: "Dibuat",
      value: kelas.createdAt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
  ];

  return (
    <>
      {backLink}

      <PageHeader
        item={{
          href: `/admin/kelas/${kelas.id}`,
          label: `Kelas ${kelas.name}`,
          description: `${kelas.major} · ${total} murid`,
        }}
        actions={
          <>
            <EditClassButton
              variant="button"
              cls={{
                id: kelas.id,
                name: kelas.name,
                majorId: kelas.majorId,
                homeroomTeacherId: kelas.homeroomTeacherId,
              }}
              majors={majorOptions}
              teachers={teacherOptions}
            />

            <DeleteButton
              variant="button"
              action={deleteClass.bind(null, String(kelas.id), true)}
              label={`kelas ${kelas.name}`}
              warning={
                total > 0
                  ? `${total} murid di kelas ini tidak ikut terhapus, tetapi akan menjadi belum punya kelas.`
                  : undefined
              }
            />
          </>
        }
      />

      <div className="space-y-6">
        <Card title="Informasi Kelas">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {info.map((item) => (
              <div key={item.label}>
                <dt className="text-xs font-bold uppercase tracking-wide text-black/50">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title={`Daftar Murid (${total})`}>
          <DataTable
            columns={[
              { key: "no", label: "No" },
              { key: "studentNumber", label: "NIS" },
              { key: "fullName", label: "Nama" },
              { key: "username", label: "Username" },
              { key: "academicYear", label: "Tahun Ajaran" },
              {
                key: "status",
                label: "Status",
                render: (row) =>
                  row.status === "active" ? (
                    <Badge tone="green">Aktif</Badge>
                  ) : (
                    <Badge tone="gray">Nonaktif</Badge>
                  ),
              },
            ]}
            rows={kelas.students.map((student, index) => ({
              ...student,
              no: index + 1,
            }))}
            emptyText="Belum ada murid di kelas ini."
          />

          {total === 0 && (
            <p className="mt-4 text-sm text-black/50">
              Masukkan murid ke kelas ini lewat{" "}
              <Link
                href="/admin/akun?role=murid"
                className="font-semibold text-blue-700 hover:underline"
              >
                Manajemen Akun
              </Link>
              .
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
