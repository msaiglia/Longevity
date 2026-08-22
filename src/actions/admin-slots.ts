"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { slots, bookings, waitlist, courses, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { createSlotSchema } from "@/lib/validation";
import { formatDateTimeLabel } from "@/lib/utils";
import { sendCancellationEmail, sendSlotUpdatedEmail } from "@/lib/emails";

export type SlotFormState = { ok: boolean; error?: string; created?: number };

async function getOrCreateDefaultCourse() {
  const [existing] = await db.select().from(courses).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(courses)
    .values({
      name: "Corso Longevity",
      description: "Sessioni del corso tenuto dal Dott. Carlo Poggioli.",
      instructor: "Dott. Carlo Poggioli",
    })
    .returning();
  return created;
}

const MAX_RECURRING_SLOTS = 104; // ~2 anni a 1 sessione/settimana, margine di sicurezza

export async function createSlotAction(
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const admin = await requireAdmin();

  const isRecurring = formData.get("recurring") === "on";

  const base = createSlotSchema.safeParse({
    date: formData.get("date") || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    capacity: formData.get("capacity"),
    notes: formData.get("notes") || undefined,
    cancelWindowHours: formData.get("cancelWindowHours") || 2,
  });

  if (!base.success) {
    return { ok: false, error: base.error.issues[0]?.message ?? "Dati non validi." };
  }

  const { startTime, endTime, capacity, notes, cancelWindowHours } = base.data;
  const course = await getOrCreateDefaultCourse();

  if (!isRecurring) {
    if (!base.data.date) {
      return { ok: false, error: "Seleziona una data." };
    }
    const startsAt = new Date(`${base.data.date}T${startTime}:00`);
    const endsAt = new Date(`${base.data.date}T${endTime}:00`);

    await db.insert(slots).values({
      courseId: course.id,
      startsAt,
      endsAt,
      capacity,
      notes,
      cancelWindowHours,
      createdBy: admin.id,
    });

    revalidatePath("/admin/slot");
    revalidatePath("/prenota");
    return { ok: true, created: 1 };
  }

  // Percorso ricorrente
  const days = formData.getAll("daysOfWeek").map((d) => Number(d));
  if (days.length === 0) {
    return { ok: false, error: "Seleziona almeno un giorno della settimana." };
  }
  if (!base.data.startDate || !base.data.endDate) {
    return { ok: false, error: "Seleziona l'intervallo di date della ricorrenza." };
  }
  if (base.data.endDate < base.data.startDate) {
    return { ok: false, error: "La data di fine deve essere dopo la data di inizio." };
  }

  const dates: string[] = [];
  const cursor = new Date(`${base.data.startDate}T00:00:00Z`);
  const end = new Date(`${base.data.endDate}T00:00:00Z`);
  while (cursor <= end && dates.length < MAX_RECURRING_SLOTS) {
    if (days.includes(cursor.getUTCDay())) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (dates.length === 0) {
    return { ok: false, error: "Nessuna data corrisponde ai giorni selezionati nell'intervallo scelto." };
  }

  await db.insert(slots).values(
    dates.map((date) => ({
      courseId: course.id,
      startsAt: new Date(`${date}T${startTime}:00`),
      endsAt: new Date(`${date}T${endTime}:00`),
      capacity,
      notes,
      cancelWindowHours,
      createdBy: admin.id,
    })),
  );

  revalidatePath("/admin/slot");
  revalidatePath("/prenota");
  return { ok: true, created: dates.length };
}

export async function updateSlotAction(
  slotId: string,
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  await requireAdmin();

  const [slot] = await db.select().from(slots).where(eq(slots.id, slotId)).limit(1);
  if (!slot) return { ok: false, error: "Sessione non trovata." };

  const parsed = createSlotSchema.safeParse({
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    capacity: formData.get("capacity"),
    notes: formData.get("notes") || undefined,
    cancelWindowHours: formData.get("cancelWindowHours") || 2,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  if (!parsed.data.date) {
    return { ok: false, error: "Seleziona una data." };
  }

  const { date, startTime, endTime, capacity, notes, cancelWindowHours } = parsed.data;
  const newStartsAt = new Date(`${date}T${startTime}:00`);
  const newEndsAt = new Date(`${date}T${endTime}:00`);

  const activeBookings = await db
    .select()
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(
      and(eq(bookings.slotId, slotId), eq(bookings.status, "confirmed"), eq(users.role, "athlete")),
    );

  if (capacity < activeBookings.length) {
    return {
      ok: false,
      error: `Non puoi impostare una capienza inferiore alle ${activeBookings.length} prenotazioni già confermate.`,
    };
  }

  const timeChanged =
    newStartsAt.getTime() !== slot.startsAt.getTime() || newEndsAt.getTime() !== slot.endsAt.getTime();
  const oldLabel = formatDateTimeLabel(slot.startsAt, slot.endsAt);
  const newLabel = formatDateTimeLabel(newStartsAt, newEndsAt);

  await db
    .update(slots)
    .set({ startsAt: newStartsAt, endsAt: newEndsAt, capacity, notes, cancelWindowHours })
    .where(eq(slots.id, slotId));

  if (timeChanged) {
    for (const row of activeBookings) {
      await sendSlotUpdatedEmail(row.users.email, row.users.firstName, oldLabel, newLabel).catch(
        () => null,
      );
    }
  }

  revalidatePath("/admin/slot");
  revalidatePath("/prenota");
  return { ok: true };
}

export async function cancelSlotAction(slotId: string) {
  await requireAdmin();

  const [slot] = await db.select().from(slots).where(eq(slots.id, slotId)).limit(1);
  if (!slot) return { ok: false, error: "Sessione non trovata." };

  await db.update(slots).set({ status: "cancelled" }).where(eq(slots.id, slotId));

  const activeBookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.slotId, slotId), eq(bookings.status, "confirmed")));

  for (const b of activeBookings) {
    await db
      .update(bookings)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(bookings.id, b.id));
    const [athlete] = await db.select().from(users).where(eq(users.id, b.userId)).limit(1);
    if (athlete) {
      await sendCancellationEmail(
        athlete.email,
        athlete.firstName,
        formatDateTimeLabel(slot.startsAt, slot.endsAt),
      ).catch(() => null);
    }
  }

  await db
    .update(waitlist)
    .set({ status: "expired" })
    .where(and(eq(waitlist.slotId, slotId), eq(waitlist.status, "waiting")));

  revalidatePath("/admin/slot");
  revalidatePath("/prenota");
  return { ok: true };
}
