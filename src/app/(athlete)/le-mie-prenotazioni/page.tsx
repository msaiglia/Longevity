import { db } from "@/db";
import { bookings, slots, waitlist, feedback as feedbackTable } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";
import { Badge, Card } from "@/components/ui/primitives";
import { formatDateTimeLabel, isPast } from "@/lib/utils";
import { CancelBookingButton, ConfirmOfferButton } from "@/components/booking-actions";
import { FeedbackForm } from "@/components/feedback-form";

export const dynamic = "force-dynamic";

export default async function LeMiePrenotazioniPage() {
  const user = await requireAthlete();

  const myBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, user.id));

  const slotIds = myBookings.map((b) => b.slotId);
  const mySlots = slotIds.length
    ? await db.select().from(slots).where(inArray(slots.id, slotIds))
    : [];
  const slotById = new Map(mySlots.map((s) => [s.id, s]));

  const bookingIds = myBookings.map((b) => b.id);
  const myFeedback = bookingIds.length
    ? await db.select().from(feedbackTable).where(inArray(feedbackTable.bookingId, bookingIds))
    : [];
  const feedbackByBooking = new Set(myFeedback.map((f) => f.bookingId));

  const myWaitlist = await db
    .select()
    .from(waitlist)
    .where(
      and(
        eq(waitlist.userId, user.id),
        inArray(waitlist.status, ["waiting", "offered"]),
      ),
    );

  const upcoming = myBookings
    .filter((b) => b.status === "confirmed" && slotById.get(b.slotId) && !isPast(slotById.get(b.slotId)!.startsAt))
    .sort((a, b) => slotById.get(a.slotId)!.startsAt.getTime() - slotById.get(b.slotId)!.startsAt.getTime());

  const past = myBookings
    .filter((b) => slotById.get(b.slotId) && isPast(slotById.get(b.slotId)!.endsAt) && b.status !== "cancelled")
    .sort((a, b) => slotById.get(b.slotId)!.startsAt.getTime() - slotById.get(a.slotId)!.startsAt.getTime());

  const attendedCount = myBookings.filter((b) => b.status === "attended").length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[24px] font-medium text-ink">Le mie prenotazioni</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          Il tuo percorso: <span className="font-medium text-ocean">{attendedCount}</span>{" "}
          {attendedCount === 1 ? "sessione completata" : "sessioni completate"}.
        </p>
      </div>

      {myWaitlist.length > 0 && (
        <section>
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
            Lista d&apos;attesa
          </h2>
          <div className="space-y-2.5">
            {myWaitlist.map((w) => {
              const s = slotById.get(w.slotId);
              if (!s) return null;
              return (
                <Card key={w.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-medium text-ink">
                      {formatDateTimeLabel(s.startsAt, s.endsAt)}
                    </p>
                    {w.status === "offered" ? (
                      <Badge tone="leaf" className="mt-1">Posto disponibile — conferma ora</Badge>
                    ) : (
                      <Badge tone="neutral" className="mt-1">In attesa · posizione {w.position}</Badge>
                    )}
                  </div>
                  {w.status === "offered" && <ConfirmOfferButton waitlistId={w.id} />}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          Prossime sessioni
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-[13.5px] text-muted">Nessuna prenotazione futura.</p>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((b) => {
              const s = slotById.get(b.slotId)!;
              return (
                <Card key={b.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-medium text-ink">
                      {formatDateTimeLabel(s.startsAt, s.endsAt)}
                    </p>
                    <a
                      href={`/api/bookings/${b.id}/ics`}
                      className="mt-1 inline-block text-[12.5px] text-ocean hover:underline"
                    >
                      Aggiungi al calendario
                    </a>
                  </div>
                  <CancelBookingButton bookingId={b.id} />
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          Storico
        </h2>
        {past.length === 0 ? (
          <p className="text-[13.5px] text-muted">Nessuna sessione passata.</p>
        ) : (
          <div className="space-y-2.5">
            {past.map((b) => {
              const s = slotById.get(b.slotId)!;
              return (
                <Card key={b.id} className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[14px] font-medium text-ink">
                      {formatDateTimeLabel(s.startsAt, s.endsAt)}
                    </p>
                    <Badge tone={b.status === "attended" ? "leaf" : b.status === "no_show" ? "red" : "neutral"}>
                      {b.status === "attended" ? "Presente" : b.status === "no_show" ? "Assente" : "Confermata"}
                    </Badge>
                  </div>
                  {b.status === "attended" && !feedbackByBooking.has(b.id) && (
                    <FeedbackForm bookingId={b.id} />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
