import { Input } from "@/components/ui/input";
import { type CompetencyScore, CATEGORY_LABELS } from "../_types";

interface CompetencyScoresStepProps {
  scores: CompetencyScore[];
  updateScore: (id: number, score: number) => void;
  totalScore: number;
  averageScore: number;
}

export function CompetencyScoresStep({
  scores,
  updateScore,
  totalScore,
  averageScore,
}: CompetencyScoresStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nilai Kompetensi</h2>
      <p className="text-muted-foreground text-sm">
        Nilai dihitung dari tugas yang telah disetujui. Anda dapat mengubah
        nilai secara manual.
      </p>

      {scores.length === 0 ? (
        <p className="text-muted-foreground">
          Tidak ada data kompetensi untuk siswa ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="border px-3 py-2 text-left">Kompetensi</th>
                <th className="border px-3 py-2 text-left">Kategori</th>
                <th className="w-24 border px-3 py-2 text-center">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.competencyId}>
                  <td className="border px-3 py-2">{s.name}</td>
                  <td className="border px-3 py-2">
                    {CATEGORY_LABELS[s.category] ?? s.category}
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={s.score}
                      onChange={(e) =>
                        updateScore(
                          s.competencyId,
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full text-center"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30 text-base font-semibold">
                <td colSpan={2} className="border px-3 py-2 text-right">
                  Total Nilai
                </td>
                <td className="border px-3 py-2 text-center text-blue-600">
                  {totalScore}
                </td>
              </tr>
              <tr className="bg-muted/50 text-base font-semibold">
                <td colSpan={2} className="border px-3 py-2 text-right">
                  Rata-rata Nilai
                </td>
                <td className="border px-3 py-2 text-center text-blue-600">
                  {averageScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
