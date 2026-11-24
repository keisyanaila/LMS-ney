import OnlineTake from "@/components/siswa/OnlineTake";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; aid: string }>;
}) {
  const { id, aid } = await params;

  return <OnlineTake tcId={id} aid={aid} section="ujian" />;
}
