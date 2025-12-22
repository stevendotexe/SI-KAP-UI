"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUploadField, type FileUploadValue } from "@/components/ui/file-upload-field"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/trpc/react"
import { toast } from "sonner"


export const ACTIVITY_TYPES = [
    { value: "in_class", label: "In-Class" },
    { value: "field_trip", label: "Field Trip" },
    { value: "meet_greet", label: "Meet & Greet" },
] as const

export type ActivityType = typeof ACTIVITY_TYPES[number]["value"]

export type CalendarEvent = {
    id: number
    title: string
    type: string // Changed to string to match flexible type usage
    startDate: Date
    dueDate: Date
    organizerName: string | null
    organizerLogoUrl: string | null
    colorHex: string | null
    placementId: number | null
    description: string | null
}

type FormData = {
    title: string
    type: ActivityType
    date: string
    time: string
    endDate: string
    description: string
    organizerName: string
    organizerLogo: FileUploadValue[]
    placementId: number | null
    attachments: FileUploadValue[]
    colorHex: string
}

const defaultFormData: FormData = {
    title: "",
    type: "in_class",
    date: "",
    time: "09:00",
    endDate: "",
    description: "",
    organizerName: "",
    organizerLogo: [],
    placementId: null,
    attachments: [],
    colorHex: "#3b82f6", // Default Blue
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingEvent: CalendarEvent | null
    onSuccess: () => void
}

export default function ActivityFormDialog({ open, onOpenChange, editingEvent, onSuccess }: Props) {
    const [formData, setFormData] = useState<FormData>(defaultFormData)
    const utils = api.useUtils()

    // Query full details when editing to ensure we have attachments, description, and proper logo url
    const { data: detailData, isLoading: isLoadingDetail } = api.calendarEvents.detail.useQuery(
        { eventId: editingEvent?.id ?? 0 },
        {
            enabled: open && !!editingEvent,
            refetchOnWindowFocus: false
        }
    )

    useEffect(() => {
        if (open) {
            if (editingEvent) {
                // If we have detail data, use it. Otherwise fall back to editingEvent (partial) or wait.
                // We prefer waiting for detailData for things like attachments.
                if (detailData) {
                    const start = new Date(detailData.startDate)
                    setFormData({
                        title: detailData.title,
                        type: detailData.type as ActivityType,
                        date: start.toISOString().slice(0, 10),
                        time: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
                        endDate: detailData.dueDate ? new Date(detailData.dueDate).toISOString().slice(0, 10) : "",
                        description: detailData.description ?? "",
                        organizerName: detailData.organizerName ?? "",
                        organizerLogo: detailData.organizerLogoUrl ? [{ url: detailData.organizerLogoUrl }] : [],
                        placementId: detailData.placementId,
                        attachments: detailData.attachments.map(a => ({
                            url: a.url,
                            name: a.filename ?? "File",
                            size: a.sizeBytes ?? 0,
                            type: a.mimeType ?? ""
                        })),
                        colorHex: detailData.colorHex ?? "#3b82f6",
                    })
                } else {
                    // Initial fallback while loading detail
                    const start = new Date(editingEvent.startDate)
                    setFormData({
                        title: editingEvent.title,
                        type: editingEvent.type as ActivityType,
                        date: start.toISOString().slice(0, 10),
                        time: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
                        endDate: editingEvent.dueDate ? new Date(editingEvent.dueDate).toISOString().slice(0, 10) : "",
                        description: editingEvent.description ?? "",
                        organizerName: editingEvent.organizerName ?? "",
                        organizerLogo: editingEvent.organizerLogoUrl ? [{ url: editingEvent.organizerLogoUrl }] : [],
                        placementId: editingEvent.placementId,
                        attachments: [], // Empty until detail loads
                        colorHex: editingEvent.colorHex ?? "#3b82f6",
                    })
                }
            } else {
                setFormData(defaultFormData)
            }
        }
    }, [open, editingEvent, detailData])

    const createMutation = api.calendarEvents.create.useMutation({
        onSuccess: () => {
            toast.success("Aktivitas berhasil dibuat")
            onSuccess()
            onOpenChange(false)
        },
        onError: (err) => toast.error(err.message),
    })

    const updateMutation = api.calendarEvents.update.useMutation({
        onSuccess: () => {
            toast.success("Aktivitas berhasil diperbarui")
            onSuccess()
            onOpenChange(false)
        },
        onError: (err) => toast.error(err.message),
    })

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!formData.date) {
            toast.error("Tanggal mulai wajib diisi")
            return
        }

        const dateTimeStr = `${formData.date}T${formData.time}:00`
        const scheduledAt = new Date(dateTimeStr)

        if (isNaN(scheduledAt.getTime())) {
            toast.error("Format tanggal atau waktu tidak valid")
            return
        }

        const data = {
            title: formData.title,
            type: formData.type,
            date: scheduledAt,
            endDate: formData.endDate ? new Date(formData.endDate) : undefined,
            description: formData.description || undefined,
            organizerName: formData.organizerName || undefined,
            organizerLogoUrl: formData.organizerLogo.length > 0 ? formData.organizerLogo[0]?.url : undefined,
            placementId: formData.placementId ?? undefined,
            colorHex: formData.colorHex || undefined,
            attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
        }

        if (editingEvent) {
            updateMutation.mutate({
                eventId: editingEvent.id,
                ...data,
            })
        } else {
            createMutation.mutate(data)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingEvent ? "Edit Aktivitas" : "Tambah Aktivitas Baru"}</DialogTitle>
                </DialogHeader>

                {editingEvent && isLoadingDetail ? (
                    <div className="flex justify-center py-8">
                        <Spinner className="size-8" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Judul Aktivitas *</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                                placeholder="Masukkan judul aktivitas"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_1.5fr] gap-6">
                            <div>
                                <label className="text-sm font-medium">Tipe Aktivitas *</label>
                                <Select value={formData.type} onValueChange={(v) => setFormData(f => ({ ...f, type: v as ActivityType }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ACTIVITY_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Warna Aktivitas</label>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="h-10 w-16 p-1 border overflow-hidden bg-white">
                                        <Input
                                            type="color"
                                            value={formData.colorHex}
                                            onChange={(e) => setFormData(f => ({ ...f, colorHex: e.target.value }))}
                                            className="w-full h-full p-0 border-0 cursor-pointer scale-150"
                                        />
                                    </div>
                                    <span className="text-sm text-muted-foreground font-mono">{formData.colorHex}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium">Tanggal Mulai *</label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Waktu</label>
                                <Input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData(f => ({ ...f, time: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Tanggal Selesai</label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData(f => ({ ...f, endDate: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Deskripsi</label>
                            <textarea
                                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                                value={formData.description}
                                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                                placeholder="Deskripsi aktivitas (opsional)"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Penyelenggara</label>
                            <Input
                                value={formData.organizerName}
                                onChange={(e) => setFormData(f => ({ ...f, organizerName: e.target.value }))}
                                placeholder="Nama penyelenggara (opsional)"
                            />
                        </div>

                        <FileUploadField
                            ownerType="calendar_event"
                            // IMPORTANT: Pass ownerId=0 for logo upload so it DOES NOT create an attachment record in DB.
                            // We only want the file URL to save to calendarEvent.organizerLogoUrl.
                            ownerId={0}
                            value={formData.organizerLogo}
                            onChange={(files) => setFormData(f => ({ ...f, organizerLogo: files }))}
                            label="Logo Penyelenggara"
                            description="Upload logo penyelenggara (opsional)"
                            accept="image/*"
                            maxFiles={1}
                        />

                        <FileUploadField
                            ownerType="calendar_event"
                            // Pass actual ownerId for attachments so they are properly linked and managed.
                            ownerId={editingEvent?.id ?? null}
                            value={formData.attachments}
                            onChange={(files) => setFormData(f => ({ ...f, attachments: files }))}
                            label="Lampiran"
                            description="Upload file lampiran (opsional)"
                            multiple
                            maxFiles={5}
                        />

                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                                {isSubmitting ? <><Spinner className="mr-2" /> Menyimpan...</> : editingEvent ? "Simpan Perubahan" : "Tambah Aktivitas"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
