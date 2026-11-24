import OnlineList from "@/components/siswa/OnlineList";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OnlineList tcId={id} section="ujian" />;
}
