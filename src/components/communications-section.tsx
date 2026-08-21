import { db } from "@/db";
import { messageRecipients, messages } from "@/db/schema";
import { and, eq, or, isNull, gt, desc } from "drizzle-orm";
import Link from "next/link";
import { MarkReadButton } from "@/components/mark-read-button";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { CheckCircle2, Eye, Megaphone } from "lucide-react";

const priorityTone = { info: "ocean", important: "amber", urgent: "red" } as const;
const priorityLabel = { info: "Informativo", important: "Importante", urgent: "Urgente" } as const;

const priorityBorder = {
  info: "border-ocean/25",
  important: "border-amber/35",
  urgent: "border-red/35",
};

const priorityBg = {
  info: "bg-sky-100",
  important: "bg-amber-100",
  urgent: "bg-red-100",
};

const dateOnlyFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" });

type Item = {
  id: string;
  title: string;
  body: string;
  priority: "info" | "important" | "urgent";
  expiresAt: Date | null;
  createdAt: Date;
  readAt: Date | null;
};

export async function CommunicationsSection({
  userId,
  role = "athlete",
  limit = 3,
}: {
  userId: string;
  role?: "athlete" | "admin";
  limit?: number;
}) {
  let active: Item[];
  let isPreview = false;

  if (role === "admin") {
    // Gli admin non sono destinatari reali dei messaggi agli atleti, ma quando
    // usano "Vista atleta" ha senso mostrargli comunque un'anteprima di ciò
    // che hanno inviato — senza inquinare le statistiche di lettura reali.
    isPreview = true;
    active = await db
      .select({
        id: messages.id,
        title: messages.title,
        body: messages.body,
        priority: messages.priority,
        expiresAt: messages.expiresAt,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        and(
          eq(messages.audience, "all"),
          or(isNull(messages.expiresAt), gt(messages.expiresAt, new Date())),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .then((rows) => rows.map((r) => ({ ...r, readAt: null })));
  } else {
    active = await db
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
      .where(
        and(
          eq(messageRecipients.userId, userId),
          or(isNull(messages.expiresAt), gt(messages.expiresAt, new Date())),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  if (active.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-ocean" strokeWidth={2} />
          <p className="font-display text-[16px] font-medium text-ink">Comunicazioni</p>
        </div>
        <Link href="/comunicazioni" className="text-[12.5px] font-medium text-ocean hover:underline">
          Vedi tutte →
        </Link>
      </div>
      <div className="space-y-3">
        {active.map((m) => (
          <div
            key={m.id}
            className={cn(
              "fade-in rounded-2xl border p-4",
              priorityBorder[m.priority],
              priorityBg[m.priority],
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={priorityTone[m.priority]}>{priorityLabel[m.priority]}</Badge>
              {m.expiresAt && (
                <span className="text-[11px] text-ink/60">
                  Scade il {dateOnlyFmt.format(m.expiresAt)}
                </span>
              )}
            </div>
            <p className="font-display text-[15px] font-medium text-ink">{m.title}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink/90">{m.body}</p>
            <div className="mt-3">
              {isPreview ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink/50">
                  <Eye className="h-4 w-4" strokeWidth={2} />
                  Anteprima — non sei un destinatario reale
                </span>
              ) : m.readAt ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-leaf">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                  Lettura confermata
                </span>
              ) : (
                <MarkReadButton messageId={m.id} />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
