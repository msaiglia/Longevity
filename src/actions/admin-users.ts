"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/emails";

export async function approveUserAction(userId: string) {
  await requireAdmin();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { ok: false, error: "Utente non trovato." };

  await db.update(users).set({ status: "approved" }).where(eq(users.id, userId));
  await sendApprovalEmail(user.email, user.firstName).catch(() => null);

  revalidatePath("/admin/utenti");
  return { ok: true };
}

export async function rejectUserAction(userId: string) {
  await requireAdmin();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { ok: false, error: "Utente non trovato." };

  await db.update(users).set({ status: "rejected" }).where(eq(users.id, userId));
  await sendRejectionEmail(user.email, user.firstName).catch(() => null);

  revalidatePath("/admin/utenti");
  return { ok: true };
}
