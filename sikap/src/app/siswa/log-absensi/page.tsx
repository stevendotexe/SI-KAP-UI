"use client"

export default function LogAbsensiPage() {
  const rows = [
    { tanggal: "20-11-2025", masuk: "07:30:45", keluar: "17:12:06" },
    { tanggal: "21-11-2025", masuk: "07:33:45", keluar: "17:14:06" },
    { tanggal: "22-11-2025", masuk: "07:35:45", keluar: "17:16:06" },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="w-full max-w-none p-5 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold">Log Absensi</h1>
          <p className="text-muted-foreground">Log histori absen Anda</p>
        </div>

        <div className="mt-8 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold">Histori absensi Anda</h2>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-destructive text-primary-foreground">
                  <th className="text-left font-medium px-4 py-3 border-r border-border last:border-r-0">Tanggal</th>
                  <th className="text-left font-medium px-4 py-3 border-r border-border last:border-r-0">Absen Masuk</th>
                  <th className="text-left font-medium px-4 py-3">Absen Keluar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.tanggal} className="bg-card">
                    <td className="px-4 py-3 border-r border-border last:border-r-0">{r.tanggal}</td>
                    <td className="px-4 py-3 border-r border-border last:border-r-0">{r.masuk}</td>
                    <td className="px-4 py-3">{r.keluar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
