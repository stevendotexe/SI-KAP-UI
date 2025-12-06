# Integrasi Halaman Mentor • Tugas

## Endpoint tRPC
- `tasks.list` (mentor/admin) → daftar tugas dengan filter: `companyId?`, `search?`, `status?`, `from?`, `to?`, `limit`, `offset`.
- `tasks.create` (mentor/admin) → membuat tugas untuk siswa aktif, mendukung lampiran.
- `tasks.update` (mentor/admin) → memperbarui detail tugas (berbasis grup: title/description/dueDate/createdById).
- `tasks.delete` (mentor/admin) → menghapus tugas (berbasis grup).
- `tasks.getSubmissions` (mentor/admin) → monitoring pengumpulan per tugas.

## Implementasi Frontend
- Daftar tugas: `src/app/mentor/tugas/page.tsx`
  - Query: `api.tasks.list.useQuery({ search, from, to, limit: 100 })`
  - Filter tanggal ke rentang bulan: `from`/`to` diturunkan dari pilihan bulan.
  - Loading/error handling dengan retry dan menampilkan pesan error.
  - `TaskCard` menautkan ke monitoring `/mentor/tugas/[id]/monitoring`.
- Tambah tugas: `src/components/tasks/AddTaskDialog.tsx`
  - Mutasi: `api.tasks.create.useMutation` dengan invalidasi `tasks.list`.
  - Validasi form kuat: judul, deskripsi, jurusan/rubrik, tanggal minimal hari ini.
  - Lampiran opsional via `FileUploadField`.
- Monitoring: `src/app/mentor/tugas/[id]/monitoring/page.tsx`
  - Query: `api.tasks.getSubmissions.useQuery({ taskId })`.
  - Ringkasan status dan grafik pie + tabel pengumpulan.

## Real-time & Konsistensi
- React Query di daftar tugas memuat berdasarkan filter bulan dan kata kunci.
- Mutasi `create` melakukan invalidasi sehingga daftar menyegarkan otomatis.

## Penanganan Error
- Daftar: menampilkan state loading, pesan error, dan tombol retry.
- Dialog tambah: toast sukses/error dan state error lokal.
- Monitoring: error state dengan tombol kembali.

## Verifikasi
- Uji dengan tugas yang memiliki berbagai status (`todo`, `in_progress`, `submitted`, `approved`, `rejected`).
- Uji lampiran tugas dan file submission tampil di monitoring.

