import AttendanceDetailClient from "@/components/students/AttendanceDetailClient"

export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  
  // Decode the date parameter (in case it's URL encoded)
  const decodedDate = decodeURIComponent(date)

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <div className="max-w-[1200px] mx-auto px-4 py-4 md:px-6 md:py-8">
        <AttendanceDetailClient date={decodedDate} />
      </div>
    </main>
  )
}
