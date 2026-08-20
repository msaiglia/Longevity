"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { messages, messageRecipients, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin, requireAthlete } from "@/lib/guards";
import { sendMessageSchema } from "@/lib/validation";
import { sendNewMessageEmail } from "@/lib/emails";

export type MessageFormState = { ok: boolean; error?: string };

export async function sendMessageAction(
  _prev: MessageFormState,
  formData: FormData,
): Promise<MessageFormState> {
  const admin = await requireAdmin();

  const parsed = sendMessageSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    priority: formData.get("priority"),
    audience: formData.get("audience"),
    userId: formData.get("userId") || undefined,
    notifyByEmail: formData.get("notifyByEmail") === "on",
    expiresAt: formData.get("expiresAt") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const { title, body, priority, audience, userId, notifyByEmail, expiresAt } = parsed.data;

  if (audience === "single" && !userId) {
    return { ok: false, error: "Seleziona un atleta destinatario." };
  }

  const [message] = await db
    .insert(messages)
    .values({
      title,
      body,
      priority,
      sentBy: admin.id,
      audience,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  const recipients =
    audience === "all"
      ? await db
          .select()
          .from(users)
          .where(and(eq(users.status, "approved"), eq(users.role, "athlete")))
      : await db.select().from(users).where(eq(users.id, userId!));

  if (recipients.length === 0) {
    return { ok: false, error: "Nessun destinatario trovato." };
  }

  await db.insert(messageRecipients).values(
    recipients.map((r) => ({ messageId: message.id, userId: r.id })),
  );

  if (notifyByEmail) {
    const preview = body.length > 140 ? `${body.slice(0, 140)}…` : body;
    for (const r of recipients) {
      if (r.notifyEmailMessages) {
        await sendNewMessageEmail(r.email, r.firstName, title, preview).catch(() => null);
      }
    }
  }

  revalidatePath("/admin/messaggi");
  revalidatePath("/prenota");
  revalidatePath("/comunicazioni");
  return { ok: true };
}

export async function markMessageReadAction(messageId: string) {
  const user = await requireAthlete();

  await db
    .update(messageRecipients)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messageRecipients.messageId, messageId),
        eq(messageRecipients.userId, user.id),
      ),
    );

  revalidatePath("/prenota");
  revalidatePath("/comunicazioni");
  return { ok: true };
}
