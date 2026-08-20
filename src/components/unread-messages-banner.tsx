import { db } from "@/db";
import { messageRecipients, messages } from "@/db/schema";
import { and, eq, isNull, desc } from "drizzle-orm";
import { MarkReadButton } from "@/components/mark-read-button";
import { cn } from "@/lib/utils";

const priorityStyles = {
  info: "border-ocean/30 bg-sky-100",
  important: "border-amber/40 bg-amber-100",
  urgent: "border-red/40 bg-red-100",
};

const priorityLabel = {
  info: "Informativo",
  important: "Importante",
  urgent: "Urgente",
};

export async function UnreadMessagesBanner({ userId }: { userId: string }) {
  const unread = await db
    .select({
      id: messages.id,
      title: messages.title,
      body: messages.body,
      priority: messages.priority,
      createdAt: messages.createdAt,
    })
    .from(messageRecipients)
    .innerJoin(messages, eq(messageRecipients.messageId, messages.id))
    .where(and(eq(messageRecipients.userId, userId), isNull(messageRecipients.readAt)))
    .orderBy(desc(messages.createdAt));

  if (unread.length === 0) return null;

  return (
    <div className="space-y-3">
      {unread.map((m) => (
        <div
          key={m.id}
          className={cn(
            "fade-in flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between",
            priorityStyles[m.priority],
          )}
        >
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink/70">
                {priorityLabel[m.priority]}
              </span>
            </div>
            <p className="font-display text-[15px] font-medium text-ink">{m.title}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink/90">{m.body}</p>
          </div>
          <div className="shrink-0">
            <MarkReadButton messageId={m.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
