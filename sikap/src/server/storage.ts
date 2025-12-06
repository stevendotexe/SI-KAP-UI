"use server";

import { env } from "@/env";
import { db } from "@/server/db";
import { attachment } from "@/server/db/schema";
import { getSession } from "@/server/better-auth/server";
import { and, eq } from "drizzle-orm";
import type {
  DeleteResponse,
  OwnerType,
  UploadResponse,
} from "./storage.types";

const MAX_BYTES = 4.5 * 1024 * 1024;

function isAllowedMime(mime: string) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  return allowed.includes(mime);
}

function buildPublicUrl(filename: string) {
  const base = env.NEXT_PUBLIC_FILE_STORAGE_API_URL ?? "";
  const url = base.endsWith("/")
    ? `${base}files/${filename}`
    : `${base}/files/${filename}`;
  return url;
}

async function maybeCompress(blob: Blob): Promise<Blob> {
  const mime = blob.type;
  if (!mime.startsWith("image/")) return blob;
  try {
    const mod = await import("@jsquash/webp");
    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    // eslint-disable-next-line
    const encoded = await (mod as any).encode(uint8, {
      quality: 70,
    });
    const out = new Blob([encoded], { type: "image/webp" });
    if (out.size > MAX_BYTES) return blob;
    return out;
  } catch {
    return blob;
  }
}

export async function uploadFilesAction(
  formData: FormData,
): Promise<UploadResponse> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  console.log("[storage] upload:start", { userId: session.user.id });
  const ownerTypeEntry = formData.get("ownerType");
  const ownerType = (
    typeof ownerTypeEntry === "string" ? ownerTypeEntry : ""
  ) as OwnerType;
  const ownerIdRaw = formData.get("ownerId");
  if (!ownerType || !ownerIdRaw) {
    throw new Error("BAD_REQUEST");
  }
  const ownerId = Number(ownerIdRaw);
  const files: File[] = [];
  for (const [key, val] of formData.entries()) {
    if (key === "file" && val instanceof File) files.push(val);
  }
  if (files.length === 0) {
    throw new Error("BAD_REQUEST");
  }

  const outForm = new FormData();
  const prepared: { original: File; result: Blob }[] = [];

  for (const f of files) {
    if (!isAllowedMime(f.type)) {
      throw new Error("UNSUPPORTED_MEDIA_TYPE");
    }
    if (f.size > MAX_BYTES) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    console.log("[storage] upload:validate", { name: f.name, type: f.type, size: f.size });
    const compressed = await maybeCompress(f);
    const name = f.name;
    const blobName =
      compressed.type === "image/webp"
        ? name.replace(/\.(png|jpg|jpeg)$/i, ".webp")
        : name;
    outForm.append(
      "file",
      new File([compressed], blobName, { type: compressed.type }),
    );
    prepared.push({ original: f, result: compressed });
  }

  const uploadUrl = `${env.NEXT_PUBLIC_FILE_STORAGE_API_URL}/upload`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "x-api-key": env.FILE_STORAGE_API_KEY ?? "",
    },
    body: outForm,
  });
  if (!res.ok) {
    console.error("[storage] upload:error", { status: res.status });
    throw new Error("STORAGE_UPLOAD_FAILED");
  }
  const json = (await res.json()) as UploadResponse;

  const items = json.data ?? [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    const size = prepared[i]?.result?.size;

    // Always construct the full URL since the API returns relative paths
    const fileUrl = buildPublicUrl(it.filename);

    // Update the item URL to be absolute for the response
    it.url = fileUrl;

    // Jika ownerId <= 0, lewati insert DB (entity belum terbentuk), tetap kembalikan hasil upload
    if (ownerId > 0) {
      await db.insert(attachment).values({
        ownerType,
        ownerId,
        url: fileUrl,
        filename: it.filename,
        mimeType: it.mimetype,
        sizeBytes: typeof size === "number" ? size : undefined,
        createdById: session.user.id,
      });
    } else {
      console.log("[storage] upload:skip-db", { filename: it.filename, reason: "placeholder-ownerId" });
    }
  }

  console.log("[storage] upload:success", {
    count: items.length,
    userId: session.user.id,
  });
  return json;
}

export async function deleteFileAction(
  filename: string,
  owner?: { ownerType: OwnerType; ownerId: number },
): Promise<DeleteResponse> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  const delUrl = `${env.NEXT_PUBLIC_FILE_STORAGE_API_URL}/file/${encodeURIComponent(filename)}`;
  const resp = await fetch(delUrl, {
    method: "DELETE",
    headers: {
      "x-api-key": env.FILE_STORAGE_API_KEY ?? "",
    },
  });
  if (!resp.ok) {
    console.error("delete:error", { status: resp.status, filename });
    throw new Error("STORAGE_DELETE_FAILED");
  }
  const json = (await resp.json()) as DeleteResponse;

  if (owner) {
    await db
      .delete(attachment)
      .where(
        and(
          eq(attachment.filename, filename),
          eq(attachment.ownerType, owner.ownerType),
          eq(attachment.ownerId, owner.ownerId),
        ),
      );
  } else {
    await db.delete(attachment).where(eq(attachment.filename, filename));
  }

  console.log("delete:success", { filename, userId: session.user.id });
  return json;
}

export async function buildPublicUrlAction(filename: string) {
  return buildPublicUrl(filename);
}
