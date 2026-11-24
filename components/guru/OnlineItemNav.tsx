import Link from "next/link";

export default function OnlineItemNav({
  base,
  active,
}: {
  base: string;
  active: "hasil" | "soal";
}) {
  // Alamat edit memakai halaman pengaturan yang sama untuk semua jenis penilaian.
  const editHref = base.replace(/\/(kuis|ujian)\/(\d+)$/, "/penilaian/$2/edit");

  const links = [
    { key: "hasil", href: base, label: "Hasil siswa" },
    { key: "soal", href: `${base}/soal`, label: "Soal" },
    { key: "edit", href: editHref, label: "Pengaturan" },
  ];

  return (
    <nav className="mb-4 flex gap-1 border-b border-black/10">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={`border-b-2 px-4 py-2 text-sm transition ${
            active === link.key
              ? "border-blue-600 font-semibold text-blue-700"
              : "border-transparent text-black/60 hover:text-black"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
