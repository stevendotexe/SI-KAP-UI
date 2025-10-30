"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select"
import { ArrowLeft, Save, PencilLine, UserPlus } from "lucide-react"
import Link from "next/link"
import { useMentors } from "@/hooks/use-mentors"
import { useStudents } from "@/hooks/use-students"

export default function MentorDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const mentorId = String(params.id)
  const { mentors, getById } = useMentors()
  const { students } = useStudents()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const mentor = useMemo(() => getById(mentorId) || mentors.find((m) => m.id === mentorId), [getById, mentorId, mentors])

  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(() => ({
    name: mentor?.name || "",
    mentorId: mentor?.mentorId || "",
    email: mentor?.email || "",
    department: mentor?.department || "",
    status: mentor?.status || "active",
    joinDate: mentor?.joinDate || "",
  }))

  // Mentees under this mentor
  const mentees = useMemo(() => students.filter((s) => s.mentorId === mentorId), [students, mentorId])
  const [menteeIds, setMenteeIds] = useState<string[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")

  useEffect(() => {
    setMenteeIds(mentees.map((m) => m.id))
  }, [mentees])

  useEffect(() => {
    if (mentor) {
      setForm({
        name: mentor.name,
        mentorId: mentor.mentorId,
        email: mentor.email,
        department: mentor.department,
        status: mentor.status as any,
        joinDate: mentor.joinDate,
      })
    }
  }, [mentor])

  const handleSave = () => {
    // No backend; pretend to save and exit edit mode
    setEditMode(false)
  }

  const availableStudents = useMemo(
    () => students.filter((s) => !menteeIds.includes(s.id)),
    [students, menteeIds]
  )

  const handleAddMentee = () => {
    if (!selectedStudentId) return
    setMenteeIds((prev) => (prev.includes(selectedStudentId) ? prev : [...prev, selectedStudentId]))
    setSelectedStudentId("")
  }

  return isLoading || !user || !mentor ? null : (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/mentors">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{mentor.name}</h1>
            <p className="text-muted-foreground mt-2">{mentor.mentorId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <Button onClick={() => setEditMode(true)}>
              <PencilLine className="h-4 w-4 mr-2" /> Edit Profil
            </Button>
          ) : (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> Simpan Perubahan
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">aktif</SelectItem>
                  <SelectItem value="inactive">nonaktif</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge>{mentor.status === "active" ? "aktif" : "nonaktif"}</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Jumlah Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentor.studentsCount}</div>
            <p className="text-xs text-muted-foreground">dibimbing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Departemen</CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <Input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
            ) : (
              <p className="text-sm font-medium">{mentor.department}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tanggal Bergabung</CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <Input value={form.joinDate} onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))} />
            ) : (
              <p className="text-sm font-medium">{mentor.joinDate}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informasi Akun */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="font-medium">{mentor.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">ID Mentor</p>
            <p className="font-medium">{mentor.mentorId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status Akun</p>
            <p className="font-medium">{mentor.status === "active" ? "aktif" : "nonaktif"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Bio Form */}
      <Card>
        <CardHeader>
          <CardTitle>Data Mentor</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Nama</p>
            {editMode ? (
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            ) : (
              <p className="font-medium">{mentor.name}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            {editMode ? (
              <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            ) : (
              <p className="font-medium">{mentor.email}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">ID Mentor</p>
            {editMode ? (
              <Input value={form.mentorId} onChange={(e) => setForm((f) => ({ ...f, mentorId: e.target.value }))} />
            ) : (
              <p className="font-medium">{mentor.mentorId}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mentees List and Add */}
      <Card>
        <CardHeader>
          <CardTitle>Siswa Dibimbing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full md:w-80">
                <SelectValue placeholder="Pilih siswa untuk ditambahkan" />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.length === 0 ? (
                  <SelectGroup>
                    <SelectLabel>Tidak ada siswa tersedia</SelectLabel>
                  </SelectGroup>
                ) : (
                  availableStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.studentId})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button onClick={handleAddMentee} disabled={!selectedStudentId}>
              <UserPlus className="h-4 w-4 mr-2" /> Tambah Siswa ke Mentor
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Nama</th>
                  <th className="text-left py-3 px-4 font-medium">ID Siswa</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {menteeIds.length > 0 ? (
                  menteeIds.map((id) => {
                    const s = students.find((st) => st.id === id)
                    if (!s) return null
                    return (
                      <tr key={id} className="border-b">
                        <td className="py-3 px-4">
                          <Link href={`/students/${s.id}`} className="text-primary hover:underline">
                            {s.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{s.studentId}</td>
                        <td className="py-3 px-4 text-muted-foreground">{s.email}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-muted-foreground">
                      Belum ada siswa dibimbing
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


