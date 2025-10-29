"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Task = {
  id: number
  title: string
  description?: string
  status?: "belum" | "proses" | "selesai"
}

export default function DaftarTugasPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [tasks] = useState<Task[]>([
    { id: 1, title: "Buatkan high-fidelity wireframe", description: "Gunakan Figma/Sketch untuk layar utama", status: "belum" },
    { id: 2, title: "Susun interactive prototype", description: "Definisikan alur utama dan micro-interactions", status: "belum" },
    { id: 3, title: "Tentukan style guide", description: "Tipografi, warna, spacing, dan komponen UI", status: "belum" },
  ])

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/login")
      else if (user.role !== "student") router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== "student") return null

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Daftar Tugas</h1>
        <p className="text-muted-foreground mt-2">Tugas yang diberikan mentor kepada Anda</p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
                {task.description && <CardDescription>{task.description}</CardDescription>}
              </div>
              {/* Hilangkan tampilan status 'Belum'; tampilkan hanya jika bukan 'belum' */}
              {task.status && task.status !== "belum" && (
                <Badge variant="outline">{task.status === "selesai" ? "Selesai" : "Proses"}</Badge>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
