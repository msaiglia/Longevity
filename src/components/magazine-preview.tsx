import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { categoryLabel, readingTimeMinutes } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";
import { BookOpen } from "lucide-react";

export async function MagazinePreview() {
  const latest = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(6);

  if (latest.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-ocean" strokeWidth={2} />
          <p className="font-display text-[16px] font-medium text-ink">Magazine</p>
        </div>
        <Link href="/magazine" className="text-[12.5px] font-medium text-ocean hover:underline">
          Vedi tutti →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {latest.map((a) => (
          <Link
            key={a.id}
            href={`/magazine/${a.slug}`}
            className="w-[180px] shrink-0 rounded-xl border border-border bg-surface p-0 transition-shadow hover:shadow-md"
          >
            {a.coverImageUrl ? (
              <img
                src={a.coverImageUrl}
                alt=""
                className="h-[100px] w-full rounded-t-xl object-cover"
              />
            ) : (
              <div className="h-[100px] w-full rounded-t-xl bg-gradient-to-br from-ocean to-leaf" />
            )}
            <div className="p-3">
              <Badge tone="leaf" className="mb-1.5">
                {categoryLabel[a.category]}
              </Badge>
              <p className="font-display text-[13px] font-medium leading-snug text-ink">{a.title}</p>
              <p className="mt-1 text-[11px] text-muted">{readingTimeMinutes(a.body)} min di lettura</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
