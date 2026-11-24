import OnlineQuestions from "@/components/guru/OnlineQuestions";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; aid: string }>;
}) {
  const { id, aid } = await params;

  return <OnlineQuestions tcId={id} aid={aid} section="kuis" />;
}
