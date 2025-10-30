"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, FileText } from "lucide-react"
import { mockBankSoal } from "@/lib/mock-data"

export default function BankSoalPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [soalList, setSoalList] = useState(mockBankSoal)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    attachment: "",
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  const handleOpenDialog = (soal?: any) => {
    if (soal) {
      setEditingId(soal.id)
      setFormData({
        title: soal.title,
        description: soal.description,
        attachment: soal.attachment || "",
      })
    } else {
      setEditingId(null)
      setFormData({ title: "", description: "", attachment: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (formData.title && formData.description) {
      if (editingId) {
        setSoalList(
          soalList.map((soal) =>
            soal.id === editingId
              ? {
                  ...soal,
                  title: formData.title,
                  description: formData.description,
                  attachment: formData.attachment,
                }
              : soal,
          ),
        )
      } else {
        const newSoal = {
          id: Date.now().toString(),
          mentorId: user.mentorId || "MEN-001",
          title: formData.title,
          description: formData.description,
          attachment: formData.attachment || null,
          createdAt: new Date().toISOString().split("T")[0],
        }
        setSoalList([...soalList, newSoal])
      }
      setIsDialogOpen(false)
      setFormData({ title: "", description: "", attachment: "" })
    }
  }

  const handleDelete = (id: string) => {
    setSoalList(soalList.filter((soal) => soal.id !== id))
  }

  const mentorSoal = soalList.filter((soal) => soal.mentorId === (user.mentorId || "MEN-001"))

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Soal</h1>
          <p className="text-muted-foreground mt-2">Kelola soal yang diberikan kepada siswa</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Soal Baru
        </Button>
      </div>

      {/* Soal List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mentorSoal.length > 0 ? (
          mentorSoal.map((soal) => (
            <Card key={soal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{soal.title}</CardTitle>
                    <CardDescription className="mt-1">{soal.createdAt}</CardDescription>
                  </div>
                  {soal.attachment && (
                    <Badge variant="outline" className="ml-2">
                      <FileText className="h-3 w-3 mr-1" />
                      File
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{soal.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(soal)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(soal.id)}
                    className="flex-1 text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Belum ada soal yang dibuat</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Soal" : "Tambah Soal Baru"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Perbarui soal yang sudah ada" : "Buat soal baru untuk siswa"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Judul Soal</label>
              <Input
                placeholder="Masukkan judul soal"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea
                placeholder="Masukkan deskripsi soal"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Lampiran (Opsional)</label>
              <Input
                placeholder="Nama file lampiran"
                value={formData.attachment}
                onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="button" onClick={handleSave}>
                {editingId ? "Perbarui Soal" : "Tambah Soal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
