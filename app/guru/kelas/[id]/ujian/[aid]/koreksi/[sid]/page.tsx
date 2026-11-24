import OnlineGrade from "@/components/guru/OnlineGrade";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; aid: string; sid: string }>;
}) {
  const { id, aid, sid } = await params;

  return <OnlineGrade tcId={id} aid={aid} sid={sid} section="ujian" />;
}
