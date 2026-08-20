import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { Card, Badge } from "@/components/ui/primitives";
import { ApproveRejectButtons } from "@/components/approve-reject-buttons";

export const dynamic = "force-dynamic";

const statusTone = { pending: "amber", approved: "leaf", rejected: "red" } as const;
const statusLabel = { pending: "In attesa", approved: "Approvato", rejected: "Rifiutato" } as const;

export default async function AdminUtentiPage() {
  await requireAdmin();

  const pending = await db
    .select()
    .from(users)
    .where(eq(users.status, "pending"))
    .orderBy(users.createdAt);

  const others = await db
    .select()
    .from(users)
    .where(ne(users.status, "pending"))
    .orderBy(desc(users.createdAt))
    .limit(30);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-[24px] font-medium text-navy">Iscrizioni</h1>

      <div>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          In attesa di approvazione ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-[13.5px] text-muted">Nessuna richiesta in sospeso.</p>
        ) : (
          <div className="space-y-2.5">
            {pending.map((u) => (
              <Card key={u.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[14px] font-medium text-navy">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-[12.5px] text-muted">{u.email} · {u.phone}</p>
                </div>
                <ApproveRejectButtons userId={u.id} />
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          Storico
        </h2>
        <Card className="divide-y divide-border p-0">
          {others.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-[13.5px] text-navy">{u.firstName} {u.lastName}</p>
                <p className="text-[12px] text-muted">{u.email}</p>
              </div>
              <Badge tone={statusTone[u.status]}>{statusLabel[u.status]}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
