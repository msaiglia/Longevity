"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const explicitNext = params.get("next");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[14.5px] text-white placeholder-white/30 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20";
  const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/60";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tua@email.it"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className={cn(inputClass, "pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error && <p className="text-[12.5px] text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-ocean py-3.5 text-[15px] font-medium text-white shadow-lg shadow-ocean/30 transition-opacity disabled:opacity-50"
      >
        {loading ? "Accesso in corso..." : "Accedi"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-5 py-16"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, #0e3a63 0%, #0b2e4e 60%, #061a2c 100%)",
      }}
    >
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl">
        <div className="mb-7 flex flex-col items-center">
          <Image
            src="/logo-alpha.png"
            alt="Longevity"
            width={56}
            height={56}
            className="mb-3 brightness-0 invert"
          />
          <h1 className="font-display text-[19px] font-medium text-white">
            Accedi al tuo account
          </h1>
          <p className="mt-1 text-[13px] text-white/50">
            Inserisci le tue credenziali per continuare
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-[12.5px] text-white/40">
          Non hai un account?{" "}
          <Link href="/registrati" className="font-medium text-sky hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
