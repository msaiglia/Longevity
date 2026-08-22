"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bookings, slots, waitlist, users } from "@/db/schema";
import { and, eq, count } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";
import { formatDateTimeLabel } from "@/lib/utils";
import {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendWaitlistPromotionEmail,
} from "@/lib/emails";

const WAITLIST_OFFER_MINUTES = 60;

async function confirmedCount(slotId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(
      and(eq(bookings.slotId, slotId), eq(bookings.status, "confirmed"), eq(users.role, "athlete")),
    );
  return row?.n ?? 0;
}

export async function createBookingAction(slotId: string) {
  const user = await requireAthlete();

  if (user.role === "admin") {
    return { ok: false, error: "Gli account staff non possono prenotare sessioni." };
  }

  const [slot] = await db.select().from(slots).where(eq(slots.id, slotId)).limit(1);
  if (!slot || slot.status !== "active") {
    return { ok: false, error: "Questa sessione non è più disponibile." };
  }
  if (slot.startsAt.getTime() < Date.now()) {
    return { ok: false, error: "Questa sessione è già iniziata o conclusa." };
  }

  const [existing] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.slotId, slotId),
        eq(bookings.userId, user.id),
        eq(bookings.status, "confirmed"),
      ),
    )
    .limit(1);
  if (existing) {
    return { ok: false, error: "Hai già una prenotazione per questa sessione." };
  }

  const taken = await confirmedCount(slotId);
  if (taken >= slot.capacity) {
    return {
      ok: false,
      error: "Sessione al completo. Puoi iscriverti in lista d'attesa.",
      full: true,
    };
  }

  await db.insert(bookings).values({ slotId, userId: user.id, status: "confirmed" });

  await sendBookingConfirmationEmail(
    user.email!,
    user.name?.split(" ")[0] ?? "",
    formatDateTimeLabel(slot.startsAt, slot.endsAt),
  ).catch(() => null);

  revalidatePath("/prenota");
  revalidatePath("/le-mie-prenotazioni");
  return { ok: true };
}

export async function joinWaitlistAction(slotId: string) {
  const user = await requireAthlete();

  if (user.role === "admin") {
    return { ok: false, error: "Gli account staff non possono prenotare sessioni." };
  }

  const [slot] = await db.select().from(slots).where(eq(slots.id, slotId)).limit(1);
  if (!slot || slot.status !== "active") {
    return { ok: false, error: "Questa sessione non è più disponibile." };
  }

  const [existing] = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(
      and(
        eq(waitlist.slotId, slotId),
        eq(waitlist.userId, user.id),
        eq(waitlist.status, "waiting"),
      ),
    )
    .limit(1);
  if (existing) {
    return { ok: false, error: "Sei già in lista d'attesa per questa sessione." };
  }

  const [{ n }] = await db
    .select({ n: count() })
    .from(waitlist)
    .where(and(eq(waitlist.slotId, slotId), eq(waitlist.status, "waiting")));

  await db.insert(waitlist).values({
    slotId,
    userId: user.id,
    status: "waiting",
    position: n + 1,
  });

  revalidatePath("/prenota");
  return { ok: true };
}

export async function cancelBookingAction(bookingId: string) {
  const user = await requireAthlete();

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!booking || booking.userId !== user.id) {
    return { ok: false, error: "Prenotazione non trovata." };
  }
  if (booking.status !== "confirmed") {
    return { ok: false, error: "Questa prenotazione non è più attiva." };
  }

  const [slot] = await db.select().from(slots).where(eq(slots.id, booking.slotId)).limit(1);
  if (!slot) return { ok: false, error: "Sessione non trovata." };

  const cutoff = slot.startsAt.getTime() - slot.cancelWindowHours * 60 * 60 * 1000;
  if (Date.now() > cutoff) {
    return {
      ok: false,
      error: `Non è più possibile cancellare online (finestra minima: ${slot.cancelWindowHours}h prima). Contatta lo staff.`,
    };
  }

  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(bookings.id, bookingId));

  await sendCancellationEmail(
    user.email!,
    user.name?.split(" ")[0] ?? "",
    formatDateTimeLabel(slot.startsAt, slot.endsAt),
  ).catch(() => null);

  await promoteNextInWaitlist(slot.id);

  revalidatePath("/prenota");
  revalidatePath("/le-mie-prenotazioni");
  return { ok: true };
}

async function promoteNextInWaitlist(slotId: string) {
  const taken = await confirmedCount(slotId);
  const [slot] = await db.select().from(slots).where(eq(slots.id, slotId)).limit(1);
  if (!slot || taken >= slot.capacity) return;

  const [next] = await db
    .select()
    .from(waitlist)
    .where(and(eq(waitlist.slotId, slotId), eq(waitlist.status, "waiting")))
    .orderBy(waitlist.position)
    .limit(1);

  if (!next) return;

  const offerExpiresAt = new Date(Date.now() + WAITLIST_OFFER_MINUTES * 60 * 1000);
  await db
    .update(waitlist)
    .set({ status: "offered", offeredAt: new Date(), offerExpiresAt })
    .where(eq(waitlist.id, next.id));

  const [athlete] = await db.select().from(users).where(eq(users.id, next.userId)).limit(1);
  if (athlete) {
    await sendWaitlistPromotionEmail(
      athlete.email,
      athlete.firstName,
      formatDateTimeLabel(slot.startsAt, slot.endsAt),
      WAITLIST_OFFER_MINUTES,
    ).catch(() => null);
  }
}

export async function confirmWaitlistOfferAction(waitlistId: string) {
  const user = await requireAthlete();

  const [entry] = await db.select().from(waitlist).where(eq(waitlist.id, waitlistId)).limit(1);
  if (!entry || entry.userId !== user.id) {
    return { ok: false, error: "Lista d'attesa non trovata." };
  }
  if (entry.status !== "offered") {
    return { ok: false, error: "Questa offerta non è più valida." };
  }
  if (!entry.offerExpiresAt || entry.offerExpiresAt.getTime() < Date.now()) {
    await db.update(waitlist).set({ status: "expired" }).where(eq(waitlist.id, entry.id));
    await promoteNextInWaitlist(entry.slotId);
    return { ok: false, error: "Il tempo per confermare è scaduto." };
  }

  const [slot] = await db.select().from(slots).where(eq(slots.id, entry.slotId)).limit(1);
  if (!slot) return { ok: false, error: "Sessione non trovata." };

  const taken = await confirmedCount(entry.slotId);
  if (taken >= slot.capacity) {
    return { ok: false, error: "Il posto non è più disponibile." };
  }

  await db.insert(bookings).values({
    slotId: entry.slotId,
    userId: user.id,
    status: "confirmed",
  });
  await db.update(waitlist).set({ status: "converted" }).where(eq(waitlist.id, entry.id));

  await sendBookingConfirmationEmail(
    user.email!,
    user.name?.split(" ")[0] ?? "",
    formatDateTimeLabel(slot.startsAt, slot.endsAt),
  ).catch(() => null);

  revalidatePath("/prenota");
  revalidatePath("/le-mie-prenotazioni");
  return { ok: true };
}
