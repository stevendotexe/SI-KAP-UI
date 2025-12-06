# API & Flow Data Dashboard Mentor

- Halaman: `src/app/mentor/dashboard/page.tsx`
- Route loading: `src/app/mentor/dashboard/loading.tsx`
- Route error: `src/app/mentor/dashboard/error.tsx`

## Endpoints tRPC

- `dashboards.getDashboardCounts` → `src/server/api/routers/dashboards.ts:242`
  - Response: `{ students, mentors, reports, graduates, lastUpdated }`
- `dashboards.getAverageStudentScores` → `src/server/api/routers/dashboards.ts:68`
  - Response: `Array<{ period: string; count: number }>`
- `dashboards.getAverageStudentAttendances` → `src/server/api/routers/dashboards.ts:117`
  - Response: `Array<{ period: string; count: number }>` (persentase 0–100)
- `dashboards.getStudentCountPerPeriod` → `src/server/api/routers/dashboards.ts:188`
  - Response: `Array<{ period: string; count: number }>`
- `dashboards.getAttendancePieChart` → `src/server/api/routers/dashboards.ts:310`
  - Response: `Array<{ name: string; value: number }>`
- `attendances.detail` (hari ini) → `src/server/api/routers/attendances.ts:161`
  - Response: `{ items: Array<AttendanceItem>, pagination, lastUpdated }`

## Flow Fetching

- Server-side batch: memanggil semua endpoint via `createCaller` dengan `Promise.all`.
- Fallback error: jika gagal, tampilkan pesan ringkas dan nilai aman agar UI tetap stabil.
- Loading route: `loading.tsx` menampilkan spinner saat segmen sedang dirender.
- Error route: `error.tsx` menangkap error segment dan menyediakan tombol `reset()`.

## Struktur Data yang Dipakai

- Timeseries: `SeriesPoint = { period: string; count: number }`.
- Pie: `{ name: string; value: number }` disaring tanpa `late` untuk ringkasan.
- Tabel harian: `AttendanceDetailItem` dipetakan ke baris `{ no, name, status, date }`.

## Catatan Performa

- Batch server call memperkecil round-trip.
- Gunakan route-level loading/error untuk UX responsif.
- Caching di sisi klien menggunakan React Query dipakai di halaman Mentor lain; dashboard memakai SSR batch sesuai kebutuhan personalisasi sesi.

