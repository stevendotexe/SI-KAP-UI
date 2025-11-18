"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/server/better-auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FieldSet,
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export default function SignUpAdminPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authClient.signUp.email(
        {
          email,
          password,
          name,
          callbackURL: "/",
        },
        {
          onSuccess: async () => {
            try {
              await fetch("/api/admin/make", { method: "POST" });
            } catch {}
            router.push("/");
          },
          onError: (ctx) => {
            setError(ctx.error.message);
          },
        },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-muted min-h-svh">
      <div className="mx-auto flex min-h-svh max-w-screen-md flex-col items-center justify-center px-4">
        <div className="mb-6 text-2xl font-bold">SI-KAP</div>
        <div className="bg-card w-full max-w-sm rounded-xl border p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Daftar Admin SI-KAP</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gunakan email dan password untuk membuat akun admin
          </p>
          {error && <FieldError className="mt-3">{error}</FieldError>}
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <FieldSet>
              <Field>
                <FieldLabel>Nama</FieldLabel>
                <FieldContent>
                  <Input
                    type="text"
                    placeholder="Nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input
                    type="email"
                    placeholder="nama@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </FieldContent>
              </Field>
            </FieldSet>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner />
                  Daftar
                </>
              ) : (
                "Daftar"
              )}
            </Button>
          </form>
        </div>
        <div className="text-muted-foreground fixed bottom-0 left-0 px-4 py-3 text-xs">
          © Gomu Rizz 2025
        </div>
      </div>
    </main>
  );
}