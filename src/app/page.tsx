import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, BellRing, Repeat, Clock, Users, Stethoscope } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: CalendarCheck,
    title: "Prenota in pochi tocchi",
    body: "Calendario sempre aggiornato con i posti disponibili per ogni sessione.",
  },
  {
    icon: BellRing,
    title: "Resta informato",
    body: "Comunicazioni dello staff sempre in evidenza, finché non le hai lette.",
  },
  {
    icon: Repeat,
    title: "Nessun posto sprecato",
    body: "Lista d'attesa automatica: se si libera un posto, sei il primo a saperlo.",
  },
];

const stats = [
  { label: "fasce orarie", value: "Flessibili", icon: Clock },
  { label: "per sessione", value: "Posti limitati", icon: Users },
  { label: "in palestra", value: "Staff dedicato", icon: Stethoscope },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <section className="relative bg-gradient-to-br from-navy via-ocean to-ocean-600 text-white">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-6 sm:px-6 sm:pt-7">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-alpha.png"
              alt="Longevity"
              width={32}
              height={32}
              className="brightness-0 invert"
            />
            <span className="font-display text-[19px] font-semibold sm:text-[21px]">
              Longevity
            </span>
          </Link>
          <div className="flex items-center gap-1.5 text-[13px] sm:gap-2 sm:text-[13.5px]">
            <Link href="/login" className="px-2.5 py-2 font-medium text-white/90 sm:px-3">
              Accedi
            </Link>
            <Link
              href="/registrati"
              className="rounded-full bg-white px-3.5 py-2 font-medium text-navy sm:px-4"
            >
              Registrati
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 text-center sm:px-6 sm:pb-28 sm:pt-14">
          <h1 className="fade-in mx-auto max-w-2xl font-display text-[32px] font-medium leading-[1.12] sm:text-[42px] sm:leading-[1.05] md:text-[62px]">
            Il tuo percorso di <em className="not-italic">longevità</em>, una sessione alla volta.
          </h1>
          <p className="mt-4 text-[13px] font-medium uppercase tracking-[0.08em] text-sky sm:mt-5 sm:text-[14px]">
            Dott. Carlo Poggioli
          </p>
          <p className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed text-white/80 sm:mt-6 sm:text-[15.5px]">
            Prenota le sessioni del corso tenuto dal Dott. Carlo Poggioli, scegli il giorno
            e l&apos;orario più comodi, ricevi conferme e promemoria automatici.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5 sm:mt-8 sm:gap-3">
            <LinkButton
              href="/registrati"
              className="!rounded-full !bg-white !text-navy !text-[14px] sm:!text-[15px]"
            >
              Iscriviti al corso
            </LinkButton>
            <LinkButton
              href="/login"
              variant="secondary"
              className="!rounded-full !border-white/40 !bg-transparent !text-white !text-[14px] sm:!text-[15px]"
            >
              Ho già un account
            </LinkButton>
          </div>
        </div>

        <svg
          className="block w-full text-background"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          style={{ height: 56 }}
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,32 C240,80 480,0 720,24 C960,48 1200,88 1440,40 L1440,80 L0,80 Z"
          />
        </svg>
      </section>

      <section className="relative z-10 mx-auto -mt-12 w-full max-w-4xl px-5 sm:-mt-14 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy shadow-xl">
          <div className="h-[3px] bg-gradient-to-r from-sky to-leaf" />
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 p-3 text-center sm:gap-2 sm:p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 sm:h-10 sm:w-10">
                  <s.icon className="h-[15px] w-[15px] text-sky sm:h-[19px] sm:w-[19px]" strokeWidth={1.8} />
                </div>
                <p className="font-display text-[13px] leading-tight text-white sm:text-[19px]">
                  {s.value}
                </p>
                <p className="text-[9.5px] leading-tight text-sky/75 sm:text-[12px]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-14 text-center sm:grid-cols-3 sm:px-6 sm:py-20">
        {features.map((f) => (
          <div key={f.title}>
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-leaf-100 sm:mb-4 sm:h-16 sm:w-16">
              <f.icon className="h-6 w-6 text-leaf sm:h-7 sm:w-7" strokeWidth={1.75} />
            </div>
            <p className="font-display text-[16px] font-medium sm:text-[17px]">{f.title}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted sm:text-[13.5px]">
              {f.body}
            </p>
          </div>
        ))}
      </section>

      <section className="bg-leaf-100 px-5 py-12 text-center sm:py-16">
        <p className="mb-4 font-display text-[21px] font-medium sm:mb-5 sm:text-[26px]">
          Pronto a iniziare il tuo percorso?
        </p>
        <LinkButton
          href="/registrati"
          className="!rounded-full !text-[14px] sm:!text-[15px]"
        >
          Iscriviti ora
        </LinkButton>
      </section>

      <footer className="mt-auto border-t border-border px-5 py-6 text-center text-[12.5px] text-muted">
        Corso Longevity — Dott. Carlo Poggioli
      </footer>
    </div>
  );
}
