"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";

export async function updateNotificationPrefsAction(formData: FormData) {
  const user = await requireAthlete();

  await db
    .update(users)
    .set({
      notifyEmailBookings: formData.get("notifyEmailBookings") === "on",
      notifyEmailMessages: formData.get("notifyEmailMessages") === "on",
    })
    .where(eq(users.id, user.id));

  revalidatePath("/profilo");
  return { ok: true };
}
