import { db } from "@/db";
import { slots, bookings, waitlist } from "@/db/schema";
import { and, eq, gte, inArray, count } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";
import { CommunicationsSection } from "@/components/communications-section";
import { Badge, Card } from "@/components/ui/primitives";
import { formatSlotDate, formatSlotTime, isPast } from "@/lib/utils";
import {
  BookButton,
  WaitlistButton,
  ConfirmOfferButton,
  CancelBookingButton,
} from "@/components/booking-actions";

export const dynamic = "force-dynamic";

export default async function PrenotaPage() {
  const user = await requireAthlete();

  const upcoming = await db
    .select()
    .from(slots)
    .where(and(eq(slots.status, "active"), gte(slots.startsAt, new Date())))
    .orderBy(slots.startsAt);

  const slotIds = upcoming.map((s) => s.id);

  const bookingCounts = slotIds.length
    ? await db
        .select({ slotId: bookings.slotId, n: count() })
        .from(bookings)
        .where(and(inArray(bookings.slotId, slotIds), eq(bookings.status, "confirmed")))
        .groupBy(bookings.slotId)
    : [];
  const countBySlot = new Map(bookingCounts.map((b) => [b.slotId, b.n]));

  const myBookings = slotIds.length
    ? await db
        .select()
        .from(bookings)
        .where(
          and(
            inArray(bookings.slotId, slotIds),
            eq(bookings.userId, user.id),
            eq(bookings.status, "confirmed"),
          ),
        )
    : [];
  const myBookingBySlot = new Map(myBookings.map((b) => [b.slotId, b]));

  const myWaitlist = slotIds.length
    ? await db
        .select()
        .from(waitlist)
        .where(and(inArray(waitlist.slotId, slotIds), eq(waitlist.userId, user.id)))
    : [];
  const myWaitlistBySlot = new Map(
    myWaitlist
      .filter((w) => w.status === "waiting" || w.status === "offered")
      .map((w) => [w.slotId, w]),
  );

  const groups = new Map<string, typeof upcoming>();
  for (const s of upcoming) {
    const key = formatSlotDate(s.startsAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[24px] font-medium text-ink">
          Ciao, {user.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-[13.5px] text-muted">Bentornato/a nella tua area Longevity.</p>
      </div>

      <CommunicationsSection userId={user.id} />

      <div>
        <h2 className="mb-1 font-display text-[18px] font-medium text-ink">
          Prenota una sessione
        </h2>
        <p className="text-[13.5px] text-muted">
          Scegli data e orario tra le sessioni disponibili del corso.
        </p>
      </div>

      {upcoming.length === 0 && (
        <Card className="text-center text-[13.5px] text-muted">
          Al momento non ci sono sessioni disponibili. Torna a controllare più tardi.
        </Card>
      )}

      {Array.from(groups.entries()).map(([dateLabel, daySlots]) => (
        <div key={dateLabel}>
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
            {dateLabel}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {daySlots.map((s) => {
              const taken = countBySlot.get(s.id) ?? 0;
              const spotsLeft = s.capacity - taken;
              const myBooking = myBookingBySlot.get(s.id);
              const myWait = myWaitlistBySlot.get(s.id);

              return (
                <Card key={s.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-[15.5px] font-medium text-ink">
                      {formatSlotTime(s.startsAt, s.endsAt)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {spotsLeft > 0 ? (
                        <Badge tone="leaf">
                          {spotsLeft} {spotsLeft === 1 ? "posto libero" : "posti liberi"}
                        </Badge>
                      ) : (
                        <Badge tone="amber">Al completo</Badge>
                      )}
                      {s.notes && <Badge tone="neutral">{s.notes}</Badge>}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {myBooking ? (
                      <div className="space-y-1.5">
                        <Badge tone="ocean">Prenotato</Badge>
                        <div>
                          <CancelBookingButton bookingId={myBooking.id} />
                        </div>
                      </div>
                    ) : myWait?.status === "offered" && !isPast(myWait.offerExpiresAt!) ? (
                      <div className="space-y-1.5">
                        <Badge tone="leaf">Posto disponibile per te</Badge>
                        <ConfirmOfferButton waitlistId={myWait.id} />
                      </div>
                    ) : myWait?.status === "waiting" ? (
                      <Badge tone="neutral">In lista d&apos;attesa</Badge>
                    ) : spotsLeft > 0 ? (
                      <BookButton slotId={s.id} />
                    ) : (
                      <WaitlistButton slotId={s.id} />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
