"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bookings, feedback as feedbackTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";
import { feedbackSchema } from "@/lib/validation";

export type FeedbackFormState = { ok: boolean; error?: string };

export async function submitFeedbackAction(
  _prev: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const user = await requireAthlete();

  const parsed = feedbackSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, parsed.data.bookingId))
    .limit(1);
  if (!booking || booking.userId !== user.id) {
    return { ok: false, error: "Prenotazione non trovata." };
  }

  await db.insert(feedbackTable).values({
    bookingId: parsed.data.bookingId,
    userId: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });

  revalidatePath("/le-mie-prenotazioni");
  return { ok: true };
}
