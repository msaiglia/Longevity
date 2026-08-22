import { notFound } from "next/navigation";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { Card } from "@/components/ui/primitives";
import { ArticleForm } from "@/components/article-form";
import { updateArticleAction } from "@/actions/articles";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!article) notFound();

  const action = updateArticleAction.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[24px] font-medium text-ink">Modifica articolo</h1>
      <Card>
        <ArticleForm
          action={action}
          initial={{
            title: article.title,
            category: article.category,
            excerpt: article.excerpt,
            body: article.body,
            authorName: article.authorName,
            coverImageUrl: article.coverImageUrl,
          }}
        />
      </Card>
    </div>
  );
}
