import OnlineDetail from "@/components/siswa/OnlineDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; aid: string }>;
}) {
  const { id, aid } = await params;

  return <OnlineDetail tcId={id} aid={aid} section="ujian" />;
}
