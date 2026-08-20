import { db } from "@/db";
import { slots, bookings, users, waitlist } from "@/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { Card, Badge } from "@/components/ui/primitives";
import { formatDateTimeLabel } from "@/lib/utils";
import { CreateSlotForm } from "@/components/create-slot-form";
import { AttendanceToggle, CancelSlotButton } from "@/components/admin-slot-actions";

export const dynamic = "force-dynamic";

export default async function AdminSlotPage() {
  await requireAdmin();

  const upcoming = await db
    .select()
    .from(slots)
    .where(and(eq(slots.status, "active"), gte(slots.startsAt, new Date())))
    .orderBy(slots.startsAt);

  const slotIds = upcoming.map((s) => s.id);

  const allBookings = slotIds.length
    ? await db.select().from(bookings).where(inArray(bookings.slotId, slotIds))
    : [];
  const bookingsBySlot = new Map<string, typeof allBookings>();
  for (const b of allBookings) {
    if (!bookingsBySlot.has(b.slotId)) bookingsBySlot.set(b.slotId, []);
    bookingsBySlot.get(b.slotId)!.push(b);
  }

  const userIds = Array.from(new Set(allBookings.map((b) => b.userId)));
  const bookedUsers = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const userById = new Map(bookedUsers.map((u) => [u.id, u]));

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

  return (
    <div className="space-y-8">
      <h1 className="font-display text-[24px] font-medium text-navy">Sessioni</h1>

      <Card>
        <h2 className="mb-4 font-display text-[16px] font-medium text-navy">Nuova sessione</h2>
        <CreateSlotForm />
      </Card>

      <div>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          Sessioni programmate
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-[13.5px] text-muted">Nessuna sessione futura. Creane una qui sopra.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => {
              const slotBookings = (bookingsBySlot.get(s.id) ?? []).filter(
                (b) => b.status !== "cancelled",
              );
              const confirmedCount = slotBookings.filter((b) => b.status !== "cancelled").length;
              const waitlistCount = waitlistCountBySlot.get(s.id) ?? 0;

              return (
                <details key={s.id} className="group rounded-xl border border-border bg-surface">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="text-[14px] font-medium text-navy">
                        {formatDateTimeLabel(s.startsAt, s.endsAt)}
                      </p>
                      {s.notes && <p className="mt-0.5 text-[12.5px] text-muted">{s.notes}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={confirmedCount >= s.capacity ? "amber" : "leaf"}>
                        {confirmedCount}/{s.capacity}
                      </Badge>
                      {waitlistCount > 0 && (
                        <Badge tone="neutral">{waitlistCount} in attesa</Badge>
                      )}
                    </div>
                  </summary>
                  <div className="space-y-3 border-t border-border px-5 py-4">
                    {slotBookings.length === 0 ? (
                      <p className="text-[13px] text-muted">Nessuna prenotazione.</p>
                    ) : (
                      <div className="space-y-2">
                        {slotBookings.map((b) => {
                          const u = userById.get(b.userId);
                          if (!u) return null;
                          return (
                            <div key={b.id} className="flex items-center justify-between gap-3">
                              <span className="text-[13.5px] text-navy">
                                {u.firstName} {u.lastName}
                              </span>
                              <AttendanceToggle bookingId={b.id} status={b.status} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex justify-end border-t border-border pt-3">
                      <CancelSlotButton slotId={s.id} />
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
