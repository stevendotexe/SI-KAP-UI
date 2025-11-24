"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { authClient } from "@/server/better-auth/client";
import logo from "@/assets/images/logo.jpg";
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

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: "/",
        },
        {
          onSuccess: () => {
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
        <Image
          src={logo}
          alt="SI-KAP"
          width={120}
          height={120}
          priority
          className="mb-6"
        />
        <div className="bg-card w-full max-w-sm rounded-xl border p-6 shadow-sm">
          <h1 className="text-lg font-semibold">SI-KAP Login</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sistem Kinerja Informasi PKL
          </p>
          {error && <FieldError className="mt-3">{error}</FieldError>}
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <FieldSet>
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
                    placeholder="************"
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
                  Login
                </>
              ) : (
                "Login"
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
