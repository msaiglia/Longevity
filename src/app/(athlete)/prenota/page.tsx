import { db } from "@/db";
import { slots, bookings, waitlist, users } from "@/db/schema";
import { and, eq, gte, inArray, count } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";
import { CommunicationsSection } from "@/components/communications-section";
import { MagazinePreview } from "@/components/magazine-preview";
import { BookingCalendarView, PreparedSlot } from "@/components/booking-calendar-view";

export const dynamic = "force-dynamic";

export default async function PrenotaPage() {
  const user = await requireAthlete();

  const upcoming = await db
    .select()
    .from(slots)
    .where(and(eq(slots.status, "active"), gte(slots.startsAt, new Date())))
    .orderBy(slots.startsAt);

  const slotIds = upcoming.map((s) => s.id);

  // Le prenotazioni fatte da un account admin (es. per provare "Vista atleta")
  // non contano come posti realmente occupati dagli atleti.
  const bookingCounts = slotIds.length
    ? await db
        .select({ slotId: bookings.slotId, n: count() })
        .from(bookings)
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(
          and(
            inArray(bookings.slotId, slotIds),
            eq(bookings.status, "confirmed"),
            eq(users.role, "athlete"),
          ),
        )
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

  const preparedSlots: PreparedSlot[] = upcoming.map((s) => {
    const taken = countBySlot.get(s.id) ?? 0;
    const myBooking = myBookingBySlot.get(s.id);
    const myWait = myWaitlistBySlot.get(s.id);
    return {
      id: s.id,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      notes: s.notes,
      capacity: s.capacity,
      spotsLeft: s.capacity - taken,
      bookingId: myBooking?.id ?? null,
      wait: myWait ? { id: myWait.id, status: myWait.status as "waiting" | "offered", expiresAt: myWait.offerExpiresAt } : null,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[24px] font-medium text-ink">
          Ciao, {user.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-[13.5px] text-muted">Bentornato/a nella tua area Longevity.</p>
      </div>

      <CommunicationsSection userId={user.id} role={user.role} />

      <MagazinePreview />

      <div>
        <h2 className="mb-1 font-display text-[18px] font-medium text-ink">
          Prenota una sessione
        </h2>
        <p className="text-[13.5px] text-muted">
          Scegli data e orario tra le sessioni disponibili del corso.
        </p>
      </div>

      <BookingCalendarView slots={preparedSlots} isAdmin={user.role === "admin"} />
    </div>
  );
}
