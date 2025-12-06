# Integrasi Halaman Mentor • Siswa

## Struktur Diperiksa
- Folder: `src/app/mentor/siswa/`
  - `page.tsx` (server) menampilkan `StudentsPageClient` (klien)
  - `[id]/page.tsx` (server) detail siswa
  - `[id]/laporan/[reportId]/page.tsx` (server) detail laporan siswa
  - Route states: `loading.tsx` dan `error.tsx` ditambahkan untuk `siswa/` dan `siswa/[id]/`

## Backend & Endpoints
- Daftar siswa: `api.students.list` (scoped oleh mentor), memetakan status dari `placement.status`
- Detail siswa: `api.students.detail` (profil + statistik + riwayat)
- Detail laporan: `api.students.reportDetail` (konten laporan, status review, skor)

## Real‑time & Sinkronisasi
- `StudentsPageClient` menggunakan React Query dengan:
  - `staleTime: 60s`
  - `refetchOnWindowFocus: true`
  - `refetchInterval: 10s` untuk penyegaran periodik (quasi real-time)
- Server pages menonaktifkan cache: `export const revalidate = 0` pada `siswa/page.tsx`, `siswa/[id]/page.tsx`, dan `siswa/[id]/laporan/[reportId]/page.tsx`.

## Penanganan Error
- Halaman klien: fallback error dengan tombol **Coba Lagi** (`StudentsPageClient`)
- Route-level `error.tsx`: menangkap error segmen dan menyediakan `reset()`
- Server fetching pada detail siswa/laporan dilindungi try/catch dengan pesan yang ramah.

## Backup & Logging
- Snapshot lokal: `StudentsPageClient` menyimpan snapshot ke `localStorage` (`mentor-siswa-backup`) setiap kali data berhasil dimuat.
- Logging server: tRPC timing middleware mencetak durasi setiap endpoint (`[TRPC] ... took ...ms`).

## Konsistensi Data
- Detail siswa memaparkan `major/cohort`, `startDate/endDate`, dan `address` dari backend.
- Navigasi tabel siswa menggunakan `user.id` sebagai kode ke rute detail: `/mentor/siswa/[id]`.

## Uji & Verifikasi
- Skenario diuji: data kosong, error backend, daftar besar, filter batch/sekolah/status.
- Performa: batch fetch server-side untuk halaman detail; polling 10s untuk daftar.

