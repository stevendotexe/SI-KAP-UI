## Tujuan

* Mengintegrasikan `FileUploadField` untuk lampiran tugas pada alur pembuatan (mentor) dan pengumpulan (siswa).

* Menyambungkan ke storage backend (Rust server) dan tRPC (`tasks.create`, `tasks.detail`, `tasks.submit`) dengan error handling yang baik.

## Perubahan Frontend

* AddTaskDialog (mentor):

  * Tambahkan `FileUploadField` dengan `ownerType="task"`, `ownerId={0}` (placeholder untuk entitas baru), `multiple`, `accept="image/*,.pdf"`, `maxSizeBytes` 4.5MB.

  * Pada submit, kirim `attachments.map(a => ({ url: a.url, filename: a.filename }))` ke `api.tasks.create`.

  * Invalidasi `tasks.list` agar daftar tugas menyegarkan.

* Daftar Tugas (mentor):

  * Pastikan `api.tasks.list` sudah terpakai dan menampilkan tugas baru dengan lampiran.

  * Tambahkan state loading/error dan tombol retry.

* Monitoring Tugas (mentor):

  * Tampilkan lampiran materi tugas (mentor) di detail (selain lampiran submission siswa yang sudah ada) menggunakan data dari `tasks.detail.attachments`.

* Unggah Tugas (siswa):

  * Pakai `FileUploadField` dengan `ownerType="task"`, `ownerId={taskId}` agar file submission ditautkan ke ID tugas.

  * Submit via `api.tasks.submit({ taskId, fileUrl, fileName, notes })`.

## Perubahan Backend (tRPC)

* `tasks.create`: sudah memasukkan `attachments` ke tabel `attachment` sebagai ownerType `task` → pastikan support tetap.

* `tasks.detail`: sudah memisahkan lampiran materi (mentor) dan submission (siswa) → tampilkan di UI.

* `tasks.submit`: hanya menerima submission untuk status `todo/in_progress` → sudah ada validasi; gunakan untuk alur siswa.

## Error Handling

* `FileUploadField`:

  * Menangani error storage: `UNSUPPORTED_MEDIA_TYPE`, `PAYLOAD_TOO_LARGE`, `UNAUTHORIZED`, `STORAGE_UPLOAD_FAILED` dengan pesan jelas.

* Dialog tambah tugas & unggah siswa:

  * Validasi form dan tampilkan feedback.

* Daftar tugas:

  * Loading spinner, error message, tombol retry.

## Pengujian

* Unit: render `FileUploadField`, `AddTaskDialog`, dan monitoring attachments.

* Integration: alur unggah → mutasi `create`/`submit` → invalidasi dan refresh daftar/monitoring.

* E2E: tambah tugas + upload lampiran, lihat di daftar & monitoring; unggah submission siswa dan verifikasi tampil di monitoring.

## Implementasi Langsung

* Menambahkan/menyesuaikan `FileUploadField` di AddTaskDialog sesuai props di atas.

* Mengirim attachments ke `tasks.create` dan menampilkan lampiran mentor di Monitoring.

* Memastikan `Unggah Tugas` siswa sudah menggunakan `ownerId={taskId}` dan submit ke `tasks.submit`.

* Menyempurnakan loading/error state serta invalidasi query untuk sinkronisasi real-time.

