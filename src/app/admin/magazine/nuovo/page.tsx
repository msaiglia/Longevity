import { requireAdmin } from "@/lib/guards";
import { Card } from "@/components/ui/primitives";
import { ArticleForm } from "@/components/article-form";
import { createArticleAction } from "@/actions/articles";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[24px] font-medium text-ink">Nuovo articolo</h1>
      <Card>
        <ArticleForm action={createArticleAction} />
      </Card>
    </div>
  );
}
