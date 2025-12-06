"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function ExamplesPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const hello = api.examples.hello.useQuery({ name: name || undefined });
  const echo = api.examples.echo.useMutation();

  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <section className="rounded-2xl border bg-card p-6 space-y-4">
          <h1 className="text-2xl font-semibold">Contoh tRPC Endpoint</h1>
          <div className="space-y-2">
            <label className="text-sm">Nama</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tuliskan nama" />
          </div>
          <div className="rounded-lg border bg-background p-4">
            {hello.isLoading ? (
              <div className="flex items-center gap-2"><Spinner /> <span className="text-sm">Memuat...</span></div>
            ) : hello.error ? (
              <p className="text-sm text-destructive">Gagal memuat</p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm">{hello.data?.message}</p>
                <p className="text-xs text-muted-foreground">Server time: {hello.data?.serverTime}</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Echo (Protected)</h2>
          <div className="space-y-2">
            <label className="text-sm">Pesan</label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tuliskan pesan" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="h-9"
              disabled={!message || echo.isPending}
              onClick={() => {
                void echo.mutateAsync({ message }).catch(() => {});
              }}
            >
              {echo.isPending ? "Mengirim..." : "Kirim"}
            </Button>
            {echo.isError && <p className="text-sm text-destructive">Gagal mengirim</p>}
          </div>
          {echo.data && (
            <div className="mt-3 rounded-lg border bg-background p-4">
              <p className="text-sm">Echo: {echo.data.echo}</p>
              <p className="text-xs text-muted-foreground">Oleh: {echo.data.from}</p>
              <p className="text-xs text-muted-foreground">Panjang: {echo.data.length}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

