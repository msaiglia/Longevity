"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, RegisterState } from "@/actions/auth";
import { Logo } from "@/components/logo";
import { Card, Label, Input, FieldError } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

const initialState: RegisterState = { ok: false };

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  if (state.ok) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-5 py-16">
        <div className="mb-8">
          <Logo />
        </div>
        <Card className="w-full max-w-sm text-center">
          <h1 className="font-display text-[20px] font-medium text-ink">
            Richiesta inviata
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
            Il tuo account è in attesa di approvazione da parte dello staff. Riceverai
            un&apos;email non appena sarà attivo.
          </p>
          <Link href="/login" className="mt-5 inline-block text-[13.5px] font-medium text-ocean hover:underline">
            Torna al login
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-[20px] font-medium text-ink">Registrati al corso</h1>
        <p className="mb-6 mt-1 text-[13.5px] text-muted">
          Dopo la registrazione lo staff verificherà il tuo account.
        </p>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">Nome</Label>
              <Input id="firstName" name="firstName" required />
              <FieldError>{state.fieldErrors?.firstName}</FieldError>
            </div>
            <div>
              <Label htmlFor="lastName">Cognome</Label>
              <Input id="lastName" name="lastName" required />
              <FieldError>{state.fieldErrors?.lastName}</FieldError>
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
            <FieldError>{state.fieldErrors?.email}</FieldError>
          </div>
          <div>
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" name="phone" type="tel" required placeholder="+39 333 1234567" />
            <FieldError>{state.fieldErrors?.phone}</FieldError>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
            <FieldError>{state.fieldErrors?.password}</FieldError>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Invio in corso..." : "Crea account"}
          </Button>
        </form>
      </Card>
      <p className="mt-5 text-[13.5px] text-muted">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-ocean hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  );
}
