import { type NextRequest } from "next/server"
import { spawn } from "child_process"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown
    const html =
      typeof body === "object" && body !== null && "html" in body
        ? (body as { html?: unknown }).html
        : undefined

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

    child.stdout.on("data", (d: unknown) => {
      if (d instanceof Buffer) chunks.push(d)
      else chunks.push(Buffer.from(String(d)))
    })
    child.stderr.on("data", (e: unknown) => {
      if (e instanceof Buffer) errors.push(e)
      else errors.push(Buffer.from(String(e)))
    })

    const exitCode: number = await new Promise((resolve) => {
      child.on("close", (code) => resolve(code ?? 1))
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
  } catch (err: unknown) {
    if (err instanceof Error) {
      return new Response(err.message ?? "Kesalahan server", { status: 500 })
    }
    if (typeof err === "string") {
      return new Response(err, { status: 500 })
    }
    try {
      return new Response(JSON.stringify(err ?? "Kesalahan server"), { status: 500 })
    } catch {
      return new Response("Kesalahan server", { status: 500 })
    }
  }
}
