## Overview

Use Next.js Server Functions (`"use server"`) instead of API routes to implement secure file upload and deletion on the Edge, with public direct reads via `NEXT_PUBLIC_FILE_STORAGE_URL`. Persist metadata in the existing `attachment` table. Client UI will call these server functions via forms/actions.

## Runtime & Compatibility

* **Edge Compatibility**: Implement functions using Web APIs only (fetch, FormData, streams, WebAssembly). Server functions will be authored for Edge compatibility; if your deployment config runs server actions on Edge, this satisfies the "Edge functions" requirement. If not, we can fall back to route handlers without changing logic.

* **Compression**: Use WASM-based WebP (`@jsquash/webp`) since native `sharp` is not supported on Edge runtime.

## Functions (in `src/server/storage.ts`)

Place all functions in `/src/server/` and mark the module with `"use server"` at the top.

* `uploadFilesAction(formData: FormData): Promise<UploadResponse>`

  * Requires `ownerType` and `ownerId` fields.

  * Extract files from `formData`.

  * Validate type and size (≤ 4.5 MB).

  * For images: compress to WebP via WASM.

  * Forward to external storage `/upload` with server-only `x-api-key`.

  * Create `attachment` rows: `{ ownerType, ownerId, url: publicUrl, filename, mimeType, sizeBytes, createdById }` where `publicUrl = NEXT_PUBLIC_FILE_STORAGE_URL + '/files/' + filename`.

  * Return normalized `{ status, data: UploadItem[] }` including `attachmentId` and `publicUrl`.

* `deleteFileAction(filename: string, owner?: { ownerType: OwnerType; ownerId: number }): Promise<DeleteResponse>`

  * Auth: verify session; authorize admin/owner.

  * Call external storage `/file/{filename}` with `DELETE` and `x-api-key`.

  * Delete `attachment` row by filename (and owner if provided).

  * Return `{ status: 'success', message, filename }`.

* `buildPublicUrl(filename: string): string`

  * Returns `NEXT_PUBLIC_FILE_STORAGE_URL + '/files/' + filename` (used in attachments and FE).

## Security

* **Authentication**: Enforced inside server functions via `getSession()` from `src/server/better-auth/server.ts`.

* **Authorization**: Upload/Delete restricted to allowed roles (admin, mentor if permitted) and/or resource ownership.

* **Secrets**: `FILE_STORAGE_URL` and `FILE_STORAGE_API_KEY` used only in server functions—never exposed to client.

* **Public Read**: Clients fetch directly from `buildPublicUrl(filename)`; no proxy created.

## Validation & Compression

* **Size**: Reject `> 4.5 * 1024 * 1024`.

* **Types**: Allow `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, etc.

* **Compression**: Use `@jsquash/webp` to encode to WebP (quality ~70) on the Edge.

## Error Handling & Logging

* Return precise errors: `400` validation, `401` unauth, `403` forbidden, `404` not found, `413` payload too large, `500` unexpected.

* Log `{ action, userId, filename, ownerType, ownerId, result, error }`.

* External calls use timeouts and a single retry on `5xx`.

## Attachment Persistence

* **Upload**: Insert into `attachment`.

* **Delete**: Remove from `attachment` by filename/owner.

* **Public URL**: Stored in `attachment.url` for FE consumption (`next/image` optimization).

## Implementation Steps

1. Add env vars: `FILE_STORAGE_URL`, `FILE_STORAGE_API_KEY`, `NEXT_PUBLIC_FILE_STORAGE_URL`, `MAX_UPLOAD_BYTES=4718592`.

2. Implement `src/server/storage.ts` with `"use server"`, auth helpers, validation, WASM compression, external storage calls, and attachment DB ops.

3. Provide TS types in `src/server/storage.types.ts` aligned with the OpenAPI JSON.

4. Integrate in FE forms/components: call `uploadFilesAction(formData)` and `deleteFileAction(filename)`.

## Testing Plan

* Edge compatibility: confirm server actions run on Edge in your deployment; validate only Web APIs are used.

* Upload tests: various images/docs; validations; compression; attachment rows created.

* Read tests: FE uses `publicUrl` directly; images optimized via `next/image`.

* Delete tests: auth path; backend deletion; attachment removal.

* Security tests: API key never exposed; only server functions access mutations.

## Acceptance Criteria

* Upload/Delete implemented as secure server functions.

* Public read via env URL; no proxy.

* Metadata persisted in `attachment`.

* Validation, compression, logging, and robust error handling completed.

If approved, I’ll implement the server functions, wire them into the UI, and perform end-to-end tests.
