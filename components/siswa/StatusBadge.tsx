import { formatScore } from "@/lib/format";
import { Badge } from "@/components/admin/ui";

export default function StatusBadge({
  status,
  score,
  max,
}: {
  status: "belum" | "terlambat" | "terkumpul" | "dinilai";
  score: number | null;
  max: number;
}) {
  if (status === "dinilai") {
    return (
      <Badge tone="green">
        Nilai {formatScore(score)}/{max}
      </Badge>
    );
  }

  if (status === "terkumpul") return <Badge>Sudah dikumpulkan</Badge>;
  if (status === "terlambat") return <Badge tone="red">Lewat tenggat</Badge>;

  return <Badge tone="gray">Belum dikumpulkan</Badge>;
}
