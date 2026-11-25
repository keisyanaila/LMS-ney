import type { Metadata } from "next";
import OnlineBoard from "@/components/siswa/OnlineBoard";

export const metadata: Metadata = { title: "Ujian | RoboLearn" };

export default async function UjianPage({
  searchParams,
}: {
  searchParams: Promise<{ mapel?: string }>;
}) {
  const { mapel } = await searchParams;

  return <OnlineBoard section="ujian" mapel={mapel} />;
}
