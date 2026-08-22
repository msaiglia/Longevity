import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";
import { Badge } from "@/components/ui/primitives";
import { categoryLabel, readingTimeMinutes } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAthlete();
  const { slug } = await params;

  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1);

  if (!article) notFound();

  const html = marked.parse(article.body) as string;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/magazine"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-ocean hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Magazine
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {article.coverImageUrl ? (
          <img src={article.coverImageUrl} alt="" className="h-[220px] w-full object-cover" />
        ) : (
          <div className="h-[220px] w-full bg-gradient-to-br from-ocean to-leaf" />
        )}
        <div className="p-5 sm:p-7">
          <Badge tone="leaf" className="mb-3">
            {categoryLabel[article.category]}
          </Badge>
          <h1 className="font-display text-[24px] font-medium leading-tight text-ink sm:text-[28px]">
            {article.title}
          </h1>
          <p className="mt-2 text-[12.5px] text-muted">
            {article.authorName} ·{" "}
            {article.publishedAt ? dateFmt.format(article.publishedAt) : ""} ·{" "}
            {readingTimeMinutes(article.body)} min di lettura
          </p>
          <div
            className="mt-5 text-[15px] leading-relaxed text-ink [&_a]:text-ocean [&_a]:underline [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-[19px] [&_h2]:font-medium [&_li]:mb-1 [&_p]:mb-3.5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
