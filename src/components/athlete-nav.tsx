import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/session";

const links = [
  { href: "/prenota", label: "Prenota" },
  { href: "/le-mie-prenotazioni", label: "Le mie prenotazioni" },
  { href: "/comunicazioni", label: "Comunicazioni" },
];

export async function AthleteNav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
        <Logo href="/prenota" />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-sky-100 hover:text-ocean-600"
            >
              {l.label}
            </Link>
          ))}
          {session?.user.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-ocean transition-colors hover:bg-sky-100"
            >
              Pannello staff
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/profilo"
            className="hidden text-[13px] text-muted hover:text-ocean md:inline"
          >
            {session?.user.name}
          </Link>
          <form action={signOutAction}>
            <Button variant="secondary" size="sm" type="submit">
              Esci
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
