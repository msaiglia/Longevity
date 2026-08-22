import { db } from "@/db";
import { slots, bookings, users, waitlist } from "@/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { Card, Badge } from "@/components/ui/primitives";
import { formatSlotDate, formatSlotTime } from "@/lib/utils";
import { CreateSlotForm } from "@/components/create-slot-form";
import { AttendanceToggle, SessionActions } from "@/components/admin-slot-actions";
import { ScrollToHashSlot } from "@/components/scroll-to-hash-slot";

export const dynamic = "force-dynamic";

const monthFmt = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });

export default async function AdminSlotPage() {
  await requireAdmin();

  const upcoming = await db
    .select()
    .from(slots)
    .where(and(eq(slots.status, "active"), gte(slots.startsAt, new Date())))
    .orderBy(slots.startsAt);

  const slotIds = upcoming.map((s) => s.id);

  const allBookingsRaw = slotIds.length
    ? await db.select().from(bookings).where(inArray(bookings.slotId, slotIds))
    : [];

  const userIds = Array.from(new Set(allBookingsRaw.map((b) => b.userId)));
  const bookedUsers = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const userById = new Map(bookedUsers.map((u) => [u.id, u]));

  // Le prenotazioni fatte da un account admin (es. per provare "Vista atleta")
  // non sono atleti reali: non devono comparire nel roster né nei conteggi.
  const allBookings = allBookingsRaw.filter((b) => userById.get(b.userId)?.role === "athlete");
  const bookingsBySlot = new Map<string, typeof allBookings>();
  for (const b of allBookings) {
    if (!bookingsBySlot.has(b.slotId)) bookingsBySlot.set(b.slotId, []);
    bookingsBySlot.get(b.slotId)!.push(b);
  }

  const allWaitlist = slotIds.length
    ? await db
        .select()
        .from(waitlist)
        .where(and(inArray(waitlist.slotId, slotIds), inArray(waitlist.status, ["waiting", "offered"])))
    : [];
  const waitlistCountBySlot = new Map<string, number>();
  for (const w of allWaitlist) {
    waitlistCountBySlot.set(w.slotId, (waitlistCountBySlot.get(w.slotId) ?? 0) + 1);
  }

  const monthGroups = new Map<string, typeof upcoming>();
  for (const s of upcoming) {
    const key = monthFmt.format(s.startsAt);
    if (!monthGroups.has(key)) monthGroups.set(key, []);
    monthGroups.get(key)!.push(s);
  }

  return (
    <div className="space-y-8">
      <ScrollToHashSlot />
      <h1 className="font-display text-[24px] font-medium text-ink">Sessioni</h1>

      <Card>
        <h2 className="mb-4 font-display text-[16px] font-medium text-ink">Nuova sessione</h2>
        <CreateSlotForm />
      </Card>

      <div>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          Sessioni programmate
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-[13.5px] text-muted">Nessuna sessione futura. Creane una qui sopra.</p>
        ) : (
          <div className="space-y-6">
            {Array.from(monthGroups.entries()).map(([month, monthSlots]) => (
              <div key={month}>
                <p className="mb-2.5 font-display text-[13.5px] font-medium capitalize text-ocean">
                  {month}
                </p>
                <div className="space-y-2.5">
                  {monthSlots.map((s) => {
                    const slotBookings = (bookingsBySlot.get(s.id) ?? []).filter(
                      (b) => b.status !== "cancelled",
                    );
                    const confirmedCount = slotBookings.length;
                    const waitlistCount = waitlistCountBySlot.get(s.id) ?? 0;

                    return (
                      <details key={s.id} id={`slot-${s.id}`} className="group scroll-mt-20 rounded-xl border border-border bg-surface">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 sm:items-center sm:px-5">
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-medium capitalize text-ink sm:text-[14px]">
                              {formatSlotDate(s.startsAt)}
                            </p>
                            <p className="text-[12.5px] text-muted">{formatSlotTime(s.startsAt, s.endsAt)}</p>
                            {s.notes && <p className="mt-0.5 truncate text-[12px] text-muted">{s.notes}</p>}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <Badge tone={confirmedCount >= s.capacity ? "amber" : "leaf"}>
                              {confirmedCount}/{s.capacity}
                            </Badge>
                            {waitlistCount > 0 && (
                              <Badge tone="neutral">{waitlistCount} in attesa</Badge>
                            )}
                          </div>
                        </summary>
                        <div className="space-y-3 border-t border-border px-4 py-3.5 sm:px-5">
                          {slotBookings.length === 0 ? (
                            <p className="text-[13px] text-muted">Nessuna prenotazione.</p>
                          ) : (
                            <div className="space-y-2.5">
                              {slotBookings.map((b) => {
                                const u = userById.get(b.userId);
                                if (!u) return null;
                                return (
                                  <div
                                    key={b.id}
                                    className="flex flex-col gap-1.5 border-b border-border pb-2.5 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <span className="text-[13.5px] text-ink">
                                      {u.firstName} {u.lastName}
                                    </span>
                                    <AttendanceToggle bookingId={b.id} status={b.status} />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="border-t border-border pt-3">
                            <SessionActions
                              slotId={s.id}
                              startsAt={s.startsAt}
                              endsAt={s.endsAt}
                              capacity={s.capacity}
                              notes={s.notes}
                              cancelWindowHours={s.cancelWindowHours}
                            />
                          </div>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
