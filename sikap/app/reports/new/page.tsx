"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewReportPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    week: "",
    title: "",
    content: "",
    activities: "",
    challenges: "",
    nextWeek: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Reset form and redirect
    setFormData({
      week: "",
      title: "",
      content: "",
      activities: "",
      challenges: "",
      nextWeek: "",
    })
    router.push("/reports")
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Kirim Laporan Baru</h1>
          <p className="text-muted-foreground mt-2">Buat laporan progres mingguan Anda</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Formulir Laporan Harian</CardTitle>
          <CardDescription>Isi aktivitas dan progres harian Anda</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Day Selection */}
            <div className="space-y-2">
              <Label htmlFor="week">Hari *</Label>
              <Input
                id="week"
                name="week"
                placeholder="contoh: Senin"
                value={formData.week}
                onChange={handleChange}
                required
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Judul Laporan *</Label>
              <Input
                id="title"
                name="title"
                placeholder="contoh: Setup Awal & Orientasi"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Activities */}
            <div className="space-y-2">
              <Label htmlFor="activities">Aktivitas Hari Ini *</Label>
              <Textarea
                id="activities"
                name="activities"
                placeholder="Jelaskan aktivitas yang Anda selesaikan hari ini..."
                value={formData.activities}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            {/* Challenges */}
            <div className="space-y-2">
              <Label htmlFor="challenges">Tantangan & Solusi</Label>
              <Textarea
                id="challenges"
                name="challenges"
                placeholder="Jelaskan tantangan yang dihadapi dan cara mengatasinya..."
                value={formData.challenges}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* Next Week */}
            <div className="space-y-2">
              <Label htmlFor="nextWeek">Rencana Esok</Label>
              <Textarea
                id="nextWeek"
                name="nextWeek"
                placeholder="Apa rencana Anda esok hari?..."
                value={formData.nextWeek}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
              </Button>
              <Link href="/reports">
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
