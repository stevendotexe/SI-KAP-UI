# Integrasi Backend–Frontend Role Mentor

- Menggunakan tRPC (`api.*`) untuk seluruh pemanggilan backend.
- Menambahkan hook `useMentorCompany` di `src/components/mentor/useMentorCompany.ts` untuk mengambil `companyId` mentor melalui `api.mentors.me.useQuery()`.
- Mengganti hardcoded `companyId: 1` pada halaman mentor dengan nilai dari hook dan mengaktifkan query menggunakan opsi `enabled: !!companyId`.

## Perubahan Halaman

- `src/app/mentor/kehadiran/page.tsx`
  - Mengimpor `useMentorCompany` dan memakai `companyId` untuk `api.attendances.list.useQuery`.
  - Menambahkan state loading/error untuk profil mentor terpisah dari data kehadiran.
  - `AccumulationTable` juga memakai `companyId` dengan `enabled`.

- `src/app/mentor/kalender/page.tsx`
  - Memakai `companyId` dari `useMentorCompany` untuk `api.calendarEvents.list.useQuery`.
  - Loading/error profil mentor sebelum memuat event.

- `src/components/students/AttendanceDetailClient.tsx`
  - Memakai `companyId` dari `useMentorCompany` untuk `api.attendances.detail.useQuery`.
  - Loading/error profil mentor sebelum memuat detail presensi.

## Pola Error & Loading

- Loading profil mentor: tampilkan `<Spinner />` dan pesan informatif.
- Error profil mentor: tampilkan pesan singkat, data halaman tidak dimuat hingga profil tersedia.
- Error data: gunakan tombol **Coba Lagi** untuk `refetch()`.

## Verifikasi

- Log dev menunjukkan `mentors.me` dipanggil terlebih dahulu, diikuti pemanggilan endpoint dengan `companyId` mentor.
- Contoh: `calendarEvents.list` gagal saat `companyId=1`, lalu berjalan sukses setelah `mentors.me` mengembalikan `companyId` yang benar.

