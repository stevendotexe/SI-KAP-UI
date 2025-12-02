export type RubricCategories = Record<string, string[]>

export const RUBRIC_CATEGORIES: RubricCategories = {
  "Kompetensi Kepribadian": [
    "Disiplin",
    "Kerja sama",
    "Inisiatif",
    "Kerajinan",
    "Tanggung jawab",
  ],
  "Kompetensi Kejuruan": [
    "Penerapan KSLH",
    "Merakit Komputer",
    "Menginstalasi sistem operasi",
    "Perawatan komputer",
    "Perbaikan peripheral",
    "Menginstal software jaringan",
    "Perbaikan software jaringan",
  ],
}

export const RUBRICS_BY_MAJOR: Record<"RPL" | "TKJ", RubricCategories> = {
  RPL: RUBRIC_CATEGORIES,
  TKJ: RUBRIC_CATEGORIES,
}
