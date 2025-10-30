"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface EditBiodataFormProps {
  isOpen: boolean
  onClose: () => void
  userType: "mentor" | "siswa"
  initialValues?: {
    nama: string
    email: string
    noTelepon: string
    sekolahAsal?: string
  }
  onSubmit: (data: any) => void
}

export function EditBiodataForm({ isOpen, onClose, userType, initialValues, onSubmit }: EditBiodataFormProps) {
  const [formData, setFormData] = useState(
    initialValues || {
      nama: "",
      email: "",
      noTelepon: "",
      sekolahAsal: "",
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Biodata {userType === "mentor" ? "Mentor" : "Siswa"}</DialogTitle>
          <DialogDescription>Perbarui informasi biodata Anda</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama</label>
            <Input name="nama" value={formData.nama} onChange={handleChange} placeholder="Masukkan nama" required />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">No. Telepon</label>
            <Input
              name="noTelepon"
              value={formData.noTelepon}
              onChange={handleChange}
              placeholder="Masukkan nomor telepon"
              required
            />
          </div>

          {userType === "siswa" && (
            <div>
              <label className="text-sm font-medium">Asal Sekolah</label>
              <Input
                name="sekolahAsal"
                value={formData.sekolahAsal}
                onChange={handleChange}
                placeholder="Masukkan asal sekolah"
              />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">Simpan Biodata</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
