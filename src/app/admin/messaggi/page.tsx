import { db } from "@/db";
import { users, messages, messageRecipients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { Card, Badge } from "@/components/ui/primitives";
import { SendMessageForm } from "@/components/send-message-form";

export const dynamic = "force-dynamic";

const priorityTone = { info: "ocean", important: "amber", urgent: "red" } as const;
const priorityLabel = { info: "Informativo", important: "Importante", urgent: "Urgente" } as const;
const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default async function AdminMessaggiPage() {
  await requireAdmin();

  const athletes = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.status, "approved"));

  const sent = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(20);

  const sentIds = sent.map((m) => m.id);
  const allRecipients = sentIds.length
    ? await db.select().from(messageRecipients)
    : [];
  const totalBySent = new Map<string, number>();
  const readBySent = new Map<string, number>();
  for (const r of allRecipients) {
    if (!sentIds.includes(r.messageId)) continue;
    totalBySent.set(r.messageId, (totalBySent.get(r.messageId) ?? 0) + 1);
    if (r.readAt) readBySent.set(r.messageId, (readBySent.get(r.messageId) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-[24px] font-medium text-ink">Comunicazioni</h1>

      <Card>
        <h2 className="mb-4 font-display text-[16px] font-medium text-ink">Nuovo messaggio</h2>
        <SendMessageForm athletes={athletes} />
      </Card>

      <div>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          Messaggi inviati
        </h2>
        {sent.length === 0 ? (
          <p className="text-[13.5px] text-muted">Non hai ancora inviato comunicazioni.</p>
        ) : (
          <div className="space-y-2.5">
            {sent.map((m) => {
              const total = totalBySent.get(m.id) ?? 0;
              const read = readBySent.get(m.id) ?? 0;
              return (
                <Card key={m.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={priorityTone[m.priority]}>{priorityLabel[m.priority]}</Badge>
                    <span className="text-[12px] text-muted">{dateFmt.format(m.createdAt)}</span>
                  </div>
                  <p className="mt-2 font-display text-[15px] font-medium text-ink">{m.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{m.body}</p>
                  <p className="mt-2 text-[12.5px] font-medium text-ocean">
                    Letto da {read} su {total}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
