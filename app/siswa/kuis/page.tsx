import type { Metadata } from "next";
import OnlineBoard from "@/components/siswa/OnlineBoard";

export const metadata: Metadata = { title: "Kuis | RoboLearn" };

export default async function KuisPage({
  searchParams,
}: {
  searchParams: Promise<{ mapel?: string }>;
}) {
  const { mapel } = await searchParams;

  return <OnlineBoard section="kuis" mapel={mapel} />;
}
