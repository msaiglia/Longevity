"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";

export async function setAttendanceAction(
  bookingId: string,
  status: "attended" | "no_show" | "confirmed",
) {
  await requireAdmin();

  await db.update(bookings).set({ status }).where(eq(bookings.id, bookingId));

  revalidatePath("/admin/slot");
  return { ok: true };
}
