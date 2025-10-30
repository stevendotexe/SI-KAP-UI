"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface EditBiodataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "mentor" | "student"
  data: {
    name: string
    email: string
    phone?: string
    school?: string
    department?: string
    bio?: string
  }
  onSave: (data: any) => void
}

export function EditBiodataModal({ open, onOpenChange, type, data, onSave }: EditBiodataModalProps) {
  const [formData, setFormData] = useState(data)

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Biodata {type === "mentor" ? "Mentor" : "Siswa"}</DialogTitle>
          <DialogDescription>
            {type === "mentor" ? "Perbarui informasi biodata Anda" : "Perbarui informasi biodata siswa"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Lengkap</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Masukkan email"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Nomor Telepon</label>
            <Input
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Masukkan nomor telepon"
            />
          </div>

          {type === "student" && (
            <div>
              <label className="text-sm font-medium">Asal Sekolah</label>
              <Input
                value={formData.school || ""}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="Masukkan asal sekolah"
              />
            </div>
          )}

          {type === "mentor" && (
            <div>
              <label className="text-sm font-medium">Departemen</label>
              <Input
                value={formData.department || ""}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Masukkan departemen"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Biografi</label>
            <Textarea
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Masukkan biografi singkat"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan Perubahan</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
