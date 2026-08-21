import { db } from "@/db";
import { messageRecipients, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";
import { Card, Badge } from "@/components/ui/primitives";
import { MarkReadButton } from "@/components/mark-read-button";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

export const dynamic = "force-dynamic";

const priorityTone = { info: "ocean", important: "amber", urgent: "red" } as const;
const priorityLabel = { info: "Informativo", important: "Importante", urgent: "Urgente" } as const;

const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const dateOnlyFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" });

export default async function ComunicazioniPage() {
  const user = await requireAthlete();
  const isPreview = user.role === "admin";

  const inbox = isPreview
    ? await db
        .select({
          id: messages.id,
          title: messages.title,
          body: messages.body,
          priority: messages.priority,
          expiresAt: messages.expiresAt,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.audience, "all"))
        .orderBy(desc(messages.createdAt))
        .then((rows) => rows.map((r) => ({ ...r, readAt: null as Date | null })))
    : await db
        .select({
          id: messages.id,
          title: messages.title,
          body: messages.body,
          priority: messages.priority,
          expiresAt: messages.expiresAt,
          createdAt: messages.createdAt,
          readAt: messageRecipients.readAt,
        })
        .from(messageRecipients)
        .innerJoin(messages, eq(messageRecipients.messageId, messages.id))
        .where(eq(messageRecipients.userId, user.id))
        .orderBy(desc(messages.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-medium text-ink">Comunicazioni</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          {isPreview
            ? "Anteprima dei messaggi inviati a tutti gli atleti — non ricevi conferme di lettura reali."
            : "Storico dei messaggi ricevuti dallo staff."}
        </p>
      </div>

      {inbox.length === 0 ? (
        <p className="text-[13.5px] text-muted">Non hai ancora ricevuto comunicazioni.</p>
      ) : (
        <div className="space-y-2.5">
          {inbox.map((m) => (
            <Card
              key={m.id}
              className={cn("flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between", !isPreview && !m.readAt && "border-ocean/40")}
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone={priorityTone[m.priority]}>{priorityLabel[m.priority]}</Badge>
                  {!isPreview && !m.readAt && <Badge tone="neutral">Non letto</Badge>}
                  <span className="text-[12px] text-muted">{dateFmt.format(m.createdAt)}</span>
                  {m.expiresAt && (
                    <span className="text-[12px] text-muted">· Scadenza {dateOnlyFmt.format(m.expiresAt)}</span>
                  )}
                </div>
                <p className="font-display text-[15px] font-medium text-ink">{m.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{m.body}</p>
              </div>
              {isPreview ? (
                <div className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-muted">
                  <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                  Anteprima
                </div>
              ) : (
                !m.readAt && (
                  <div className="shrink-0">
                    <MarkReadButton messageId={m.id} />
                  </div>
                )
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
