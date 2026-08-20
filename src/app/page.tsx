import Image from "next/image";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LinkButton href="/login" variant="ghost" size="sm">
            Accedi
          </LinkButton>
          <LinkButton href="/registrati" variant="primary" size="sm">
            Registrati
          </LinkButton>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="brand-arc" />
        <div className="relative mx-auto grid max-w-5xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
          <div className="fade-in">
            <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.14em] text-ocean">
              Corso in palestra · Dott. Carlo Poggioli
            </p>
            <h1 className="font-display text-[38px] font-medium leading-[1.1] text-navy md:text-[48px]">
              Il tuo percorso di longevità,{" "}
              <em className="not-italic text-ocean">una sessione alla volta</em>.
            </h1>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-muted">
              Prenota le sessioni del corso tenuto dal Dott. Carlo Poggioli, scegli il giorno
              e l&apos;orario più comodi, ricevi conferme e promemoria automatici.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="/registrati" variant="primary">
                Iscriviti al corso
              </LinkButton>
              <LinkButton href="/login" variant="secondary">
                Ho già un account
              </LinkButton>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <Image
              src="/logo.png"
              alt="Longevity"
              width={280}
              height={280}
              className="drop-shadow-[0_18px_40px_rgba(28,111,176,0.18)]"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-5 py-14 sm:grid-cols-3">
        <Card>
          <p className="font-display text-[16px] font-medium text-navy">Prenota in pochi tocchi</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            Calendario sempre aggiornato con i posti disponibili per ogni sessione.
          </p>
        </Card>
        <Card>
          <p className="font-display text-[16px] font-medium text-navy">Resta informato</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            Comunicazioni dello staff sempre in evidenza, finché non le hai lette.
          </p>
        </Card>
        <Card>
          <p className="font-display text-[16px] font-medium text-navy">Nessun posto sprecato</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            Lista d&apos;attesa automatica: se si libera un posto, sei il primo a saperlo.
          </p>
        </Card>
      </section>

      <footer className="mt-auto border-t border-border px-5 py-6 text-center text-[12.5px] text-muted">
        Corso Longevity — Dott. Carlo Poggioli
      </footer>
    </div>
  );
}
