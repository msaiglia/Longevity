import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { requireAthlete } from "@/lib/guards";
import { Card, Badge } from "@/components/ui/primitives";
import { categoryLabel, readingTimeMinutes } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const categories = ["allenamento", "nutrizione", "prevenzione", "recupero", "novita"] as const;

export default async function MagazineListPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  await requireAthlete();
  const { categoria } = await searchParams;

  const validCategory = categories.includes(categoria as (typeof categories)[number])
    ? (categoria as (typeof categories)[number])
    : undefined;

  const list = await db
    .select()
    .from(articles)
    .where(
      validCategory
        ? and(eq(articles.status, "published"), eq(articles.category, validCategory))
        : eq(articles.status, "published"),
    )
    .orderBy(desc(articles.publishedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-medium text-ink">Magazine</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          Articoli e consigli dal Dott. Carlo Poggioli.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Link
          href="/magazine"
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium",
            !validCategory ? "border-ocean bg-ocean text-white" : "border-border text-muted",
          )}
        >
          Tutti
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/magazine?categoria=${c}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium",
              validCategory === c ? "border-ocean bg-ocean text-white" : "border-border text-muted",
            )}
          >
            {categoryLabel[c]}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="text-center text-[13.5px] text-muted">
          Nessun articolo in questa categoria per ora.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <Link key={a.id} href={`/magazine/${a.slug}`}>
              <Card className="h-full p-0 overflow-hidden transition-shadow hover:shadow-md">
                {a.coverImageUrl ? (
                  <img src={a.coverImageUrl} alt="" className="h-[140px] w-full object-cover" />
                ) : (
                  <div className="h-[140px] w-full bg-gradient-to-br from-ocean to-leaf" />
                )}
                <div className="p-4">
                  <Badge tone="leaf" className="mb-2">
                    {categoryLabel[a.category]}
                  </Badge>
                  <p className="font-display text-[15px] font-medium leading-snug text-ink">
                    {a.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{a.excerpt}</p>
                  <p className="mt-2 text-[11.5px] text-muted">
                    {readingTimeMinutes(a.body)} min di lettura
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
