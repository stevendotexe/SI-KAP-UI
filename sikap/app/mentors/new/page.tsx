"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function NewMentorPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    mentorId: "",
    email: "",
    password: "",
    department: "",
    status: "active",
    joinDate: "",
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // No backend; just navigate back
    router.push("/mentors")
  }

  return isLoading || !user ? null : (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/mentors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Tambah Mentor</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Data Mentor</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nama</p>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Kata Sandi</p>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">ID Mentor</p>
              <Input value={form.mentorId} onChange={(e) => setForm({ ...form, mentorId: e.target.value })} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Departemen</p>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">aktif</SelectItem>
                  <SelectItem value="inactive">nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tanggal Bergabung</p>
              <Input value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" /> Simpan
          </Button>
        </div>
      </form>
    </div>
  )
}


