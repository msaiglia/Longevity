"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { slots, bookings, waitlist, courses, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { createSlotSchema } from "@/lib/validation";
import { formatDateTimeLabel } from "@/lib/utils";
import { sendCancellationEmail } from "@/lib/emails";

export type SlotFormState = { ok: boolean; error?: string };

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

export async function createSlotAction(
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const admin = await requireAdmin();

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

  const { date, startTime, endTime, capacity, notes, cancelWindowHours } = parsed.data;
  const startsAt = new Date(`${date}T${startTime}:00`);
  const endsAt = new Date(`${date}T${endTime}:00`);

  const course = await getOrCreateDefaultCourse();

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
