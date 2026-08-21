import { db } from "@/db";
import { users, slots, bookings } from "@/db/schema";
import { eq, and, gte, count, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { Card, Badge } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { formatDateTimeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [{ n: pendingCount }] = await db
    .select({ n: count() })
    .from(users)
    .where(eq(users.status, "pending"));

  const [{ n: approvedCount }] = await db
    .select({ n: count() })
    .from(users)
    .where(eq(users.status, "approved"));

  const upcomingSlots = await db
    .select()
    .from(slots)
    .where(and(eq(slots.status, "active"), gte(slots.startsAt, new Date())))
    .orderBy(slots.startsAt)
    .limit(5);

  const upcomingIds = upcomingSlots.map((s) => s.id);
  const bookingCounts = upcomingIds.length
    ? await db
        .select({ slotId: bookings.slotId, n: count() })
        .from(bookings)
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(and(eq(bookings.status, "confirmed"), eq(users.role, "athlete")))
        .groupBy(bookings.slotId)
    : [];
  const countBySlot = new Map(bookingCounts.map((b) => [b.slotId, b.n]));

  const [{ n: totalNoShow }] = await db
    .select({ n: count() })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(eq(bookings.status, "no_show"), eq(users.role, "athlete")));

  const [{ n: totalAttended }] = await db
    .select({ n: count() })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(eq(bookings.status, "attended"), eq(users.role, "athlete")));

  const topAthletes = await db
    .select({ userId: bookings.userId, n: count() })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(eq(bookings.status, "attended"), eq(users.role, "athlete")))
    .groupBy(bookings.userId)
    .orderBy(desc(count()))
    .limit(5);

  const topUsers = topAthletes.length
    ? await db.select().from(users)
    : [];
  const userById = new Map(topUsers.map((u) => [u.id, u]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[24px] font-medium text-ink">Panoramica</h1>
        <LinkButton href="/admin/slot" size="sm">
          Crea sessione
        </LinkButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-[12.5px] text-muted">Iscrizioni in attesa</p>
          <p className="mt-1 font-display text-[26px] font-medium text-ink">{pendingCount}</p>
          {pendingCount > 0 && (
            <LinkButton href="/admin/utenti" size="sm" variant="ghost" className="mt-2 !px-0">
              Rivedi ora →
            </LinkButton>
          )}
        </Card>
        <Card>
          <p className="text-[12.5px] text-muted">Atleti attivi</p>
          <p className="mt-1 font-display text-[26px] font-medium text-ink">{approvedCount}</p>
        </Card>
        <Card>
          <p className="text-[12.5px] text-muted">Presenze totali</p>
          <p className="mt-1 font-display text-[26px] font-medium text-ink">{totalAttended}</p>
          <p className="mt-0.5 text-[12px] text-muted">{totalNoShow} assenze registrate</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          Prossime sessioni
        </h2>
        {upcomingSlots.length === 0 ? (
          <p className="text-[13.5px] text-muted">Nessuna sessione programmata.</p>
        ) : (
          <div className="space-y-2.5">
            {upcomingSlots.map((s) => {
              const taken = countBySlot.get(s.id) ?? 0;
              return (
                <Card key={s.id} className="flex items-center justify-between">
                  <p className="text-[13.5px] text-ink">
                    {formatDateTimeLabel(s.startsAt, s.endsAt)}
                  </p>
                  <Badge tone={taken >= s.capacity ? "amber" : "leaf"}>
                    {taken}/{s.capacity} prenotati
                  </Badge>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {topAthletes.length > 0 && (
        <div>
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
            Atleti più assidui
          </h2>
          <Card className="divide-y divide-border p-0">
            {topAthletes.map((t) => {
              const u = userById.get(t.userId);
              if (!u) return null;
              return (
                <div key={t.userId} className="flex items-center justify-between px-5 py-3">
                  <span className="text-[13.5px] text-ink">
                    {u.firstName} {u.lastName}
                  </span>
                  <span className="text-[12.5px] text-muted">{t.n} presenze</span>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
