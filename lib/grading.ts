import type { AssessmentKind } from "@/lib/guru-data";

export type Weights = Partial<Record<AssessmentKind, number>>;

type GradedItem = {
  id: number;
  kind: AssessmentKind;
  maxScore: number;
};

/**
 * Nilai akhir (0-100) dari nilai per item.
 * - Tanpa bobot: rata-rata persentase semua item yang sudah dinilai.
 * - Dengan bobot: tiap jenis dirata-rata dulu, lalu dikalikan bobotnya.
 *   Jenis yang belum punya nilai tidak ikut dihitung (bobot dinormalisasi).
 */
export function computeFinalScore(
  items: GradedItem[],
  scoreOf: (itemId: number) => number | null,
  weights: Weights | null
): number | null {
  const byKind = new Map<AssessmentKind, number[]>();

  for (const item of items) {
    const score = scoreOf(item.id);

    if (score === null || item.maxScore <= 0) continue;

    const list = byKind.get(item.kind) ?? [];
    list.push((score / item.maxScore) * 100);
    byKind.set(item.kind, list);
  }

  if (byKind.size === 0) return null;

  if (!weights) {
    const all = [...byKind.values()].flat();
    return all.reduce((sum, p) => sum + p, 0) / all.length;
  }

  let weighted = 0;
  let totalWeight = 0;

  for (const [kind, percentages] of byKind) {
    const weight = weights[kind] ?? 0;

    if (weight <= 0) continue;

    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    weighted += average * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weighted / totalWeight : null;
}
