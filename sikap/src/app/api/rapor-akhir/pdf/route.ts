import { NextRequest } from "next/server"
import { spawn } from "child_process"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json()
    if (!html || typeof html !== "string") {
      return new Response("HTML tidak valid", { status: 400 })
    }

    // Jalankan wkhtmltopdf: pastikan wkhtmltopdf terpasang di server/hosting
    // Gunakan mode stdin -> stdout
    const child = spawn("wkhtmltopdf", ["-", "-"], { stdio: ["pipe", "pipe", "pipe"] })

    // Tulis HTML ke stdin
    child.stdin.write(html)
    child.stdin.end()

    const chunks: Buffer[] = []
    const errors: Buffer[] = []

    child.stdout.on("data", (d) => chunks.push(Buffer.from(d)))
    child.stderr.on("data", (e) => errors.push(Buffer.from(e)))

    const exitCode: number = await new Promise((resolve) => {
      child.on("close", resolve)
    })

    if (exitCode !== 0) {
      const errMsg = Buffer.concat(errors).toString() || "wkhtmltopdf gagal"
      return new Response(errMsg, { status: 500 })
    }

    const pdfBuffer = Buffer.concat(chunks)
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="rapor-akhir.pdf"',
      },
    })
  } catch (e: any) {
    return new Response(e?.message || "Kesalahan server", { status: 500 })
  }
}
