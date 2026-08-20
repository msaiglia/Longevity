"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/primitives";
import { Label, Input, FieldError } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const explicitNext = params.get("next");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (res?.error) {
      setLoading(false);
      if (res.code === "account_pending") {
        setError("Il tuo account è in attesa di approvazione da parte dello staff.");
      } else if (res.code === "account_rejected") {
        setError("La tua richiesta di iscrizione non è stata approvata. Contatta il centro.");
      } else {
        setError("Email o password non corrette.");
      }
      return;
    }

    // Un admin senza una destinazione esplicita (es. non stava tornando da una
    // pagina protetta) va dritto al pannello staff invece che alla vista atleta.
    const session = await getSession();
    const destination =
      explicitNext ?? (session?.user.role === "admin" ? "/admin" : "/prenota");

    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <FieldError>{error ?? undefined}</FieldError>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Accesso in corso..." : "Accedi"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-16">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-[20px] font-medium text-navy">Bentornato/a</h1>
        <p className="mb-6 mt-1 text-[13.5px] text-muted">
          Accedi per prenotare le tue sessioni.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </Card>
      <p className="mt-5 text-[13.5px] text-muted">
        Non hai un account?{" "}
        <Link href="/registrati" className="font-medium text-ocean hover:underline">
          Registrati
        </Link>
      </p>
    </div>
  );
}
