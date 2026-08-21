import { db } from "@/db";
import { bookings, slots } from "@/db/schema";
import { and, eq, inArray, desc } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";
import { Card, Badge } from "@/components/ui/primitives";
import { Medal, Award, Trophy, Crown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });

const tiers = [
  { name: "Bronzo", min: 1, icon: Medal },
  { name: "Argento", min: 10, icon: Award },
  { name: "Oro", min: 25, icon: Trophy },
  { name: "Platino", min: 50, icon: Crown },
];

function getISOWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const weekKeys = new Set(dates.map((d) => getISOWeekKey(d)));
  const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());
  const cursor = new Date(sortedDates[0]);
  let streak = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = getISOWeekKey(cursor);
    if (!weekKeys.has(key)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return streak;
}

export default async function TraguardiPage() {
  const user = await requireAthlete();

  const myBookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.userId, user.id), inArray(bookings.status, ["attended", "no_show"])));

  const slotIds = myBookings.map((b) => b.slotId);
  const mySlots = slotIds.length
    ? await db.select().from(slots).where(inArray(slots.id, slotIds))
    : [];
  const slotById = new Map(mySlots.map((s) => [s.id, s]));

  const attended = myBookings.filter((b) => b.status === "attended");
  const totalAttended = attended.length;
  const attendedDates = attended
    .map((b) => slotById.get(b.slotId)?.startsAt)
    .filter((d): d is Date => !!d);
  const streak = computeStreak(attendedDates);

  const currentTier = [...tiers].reverse().find((t) => totalAttended >= t.min) ?? null;
  const nextTier = tiers.find((t) => totalAttended < t.min) ?? null;
  const currentMin = currentTier?.min ?? 0;
  const progress = nextTier
    ? Math.min(100, Math.round(((totalAttended - currentMin) / (nextTier.min - currentMin)) * 100))
    : 100;

  const history = myBookings
    .map((b) => ({ ...b, slot: slotById.get(b.slotId) }))
    .filter((b) => b.slot)
    .sort((a, b) => b.slot!.startsAt.getTime() - a.slot!.startsAt.getTime());

  const TierIcon = currentTier?.icon ?? Medal;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[24px] font-medium text-ink">Traguardi</h1>
        <p className="mt-1 text-[13.5px] text-muted">Il tuo percorso, sessione dopo sessione.</p>
      </div>

      <Card className="bg-gradient-to-br from-navy to-ocean-600 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10">
            <TierIcon className="h-8 w-8 text-sky" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[12.5px] text-white/60">
              {currentTier ? `Livello ${currentTier.name}` : "Inizia il tuo percorso"}
            </p>
            <p className="font-display text-[26px] font-medium">
              {totalAttended} {totalAttended === 1 ? "sessione" : "sessioni"}
            </p>
          </div>
        </div>
        {nextTier && (
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-sky" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1.5 text-[11.5px] text-white/60">
              {nextTier.min - totalAttended} {nextTier.min - totalAttended === 1 ? "sessione" : "sessioni"} al
              livello {nextTier.name}
            </p>
          </div>
        )}
      </Card>

      <Card className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Flame className="h-6 w-6 text-amber" strokeWidth={1.8} />
        </div>
        <div>
          <p className="font-display text-[19px] font-medium text-ink">
            {streak} {streak === 1 ? "settimana" : "settimane"} di fila
          </p>
          <p className="text-[12.5px] text-muted">
            {streak > 0 ? "Continua così!" : "Prenota una sessione questa settimana per iniziare una serie."}
          </p>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          Storico presenze
        </h2>
        {history.length === 0 ? (
          <Card className="text-center text-[13.5px] text-muted">
            Nessuna presenza registrata ancora. Prenota e partecipa alla tua prima sessione!
          </Card>
        ) : (
          <div className="space-y-2.5">
            {history.map((b) => (
              <Card key={b.id} className="flex items-center justify-between">
                <p className="text-[13.5px] capitalize text-ink">{dateFmt.format(b.slot!.startsAt)}</p>
                <Badge tone={b.status === "attended" ? "leaf" : "red"}>
                  {b.status === "attended" ? "Presente" : "Assente"}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
