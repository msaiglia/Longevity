import { db } from "@/db";
import { articles } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { Card, Badge } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { categoryLabel } from "@/lib/utils";
import { DeleteArticleButton } from "@/components/admin-magazine-actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });

export default async function AdminMagazinePage() {
  await requireAdmin();

  const all = await db.select().from(articles).orderBy(desc(articles.createdAt));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[24px] font-medium text-ink">Magazine</h1>
        <LinkButton href="/admin/magazine/nuovo" size="sm">
          Nuovo articolo
        </LinkButton>
      </div>

      {all.length === 0 ? (
        <p className="text-[13.5px] text-muted">
          Nessun articolo ancora. Creane uno con il pulsante qui sopra.
        </p>
      ) : (
        <div className="space-y-2.5">
          {all.map((a) => (
            <Card key={a.id} className="flex items-center gap-4">
              {a.coverImageUrl ? (
                <img
                  src={a.coverImageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-lg bg-sky-100" />
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone={a.status === "published" ? "leaf" : "amber"}>
                    {a.status === "published" ? "Pubblicato" : "Bozza"}
                  </Badge>
                  <Badge tone="neutral">{categoryLabel[a.category]}</Badge>
                </div>
                <p className="truncate text-[14px] font-medium text-ink">{a.title}</p>
                <p className="text-[12px] text-muted">
                  {a.publishedAt ? dateFmt.format(a.publishedAt) : `Creato il ${dateFmt.format(a.createdAt)}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                <Link
                  href={`/admin/magazine/${a.id}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-center text-[13px] font-medium text-ink hover:border-ocean hover:text-ocean"
                >
                  Modifica
                </Link>
                <DeleteArticleButton articleId={a.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
