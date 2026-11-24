import OnlineResults from "@/components/guru/OnlineResults";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; aid: string }>;
}) {
  const { id, aid } = await params;

  return <OnlineResults tcId={id} aid={aid} section="kuis" />;
}
