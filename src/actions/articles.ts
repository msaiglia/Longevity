"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { articles, users } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/guards";
import { articleSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { sendNewArticleEmail } from "@/lib/emails";

export type ArticleFormState = { ok: boolean; error?: string; slug?: string };

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function handleCoverImage(formData: FormData): Promise<
  { ok: true; dataUrl?: string } | { ok: false; error: string }
> {
  const file = formData.get("coverImage");
  if (!(file instanceof File) || file.size === 0) return { ok: true };
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "L'immagine non può superare 4MB." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Il file di copertina deve essere un'immagine." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  return { ok: true, dataUrl: `data:${file.type};base64,${buf.toString("base64")}` };
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base) || "articolo";
  let attempt = 0;
  while (true) {
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(
        excludeId
          ? and(eq(articles.slug, slug), ne(articles.id, excludeId))
          : eq(articles.slug, slug),
      )
      .limit(1);
    if (existing.length === 0) return slug;
    attempt++;
    slug = `${slugify(base)}-${attempt + 1}`;
  }
}

async function notifySubscribers(articleId: string) {
  const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!article) return;

  const recipients = await db
    .select()
    .from(users)
    .where(and(eq(users.status, "approved"), eq(users.role, "athlete")));

  for (const r of recipients) {
    if (r.notifyEmailMessages) {
      await sendNewArticleEmail(r.email, r.firstName, article.title, article.excerpt, article.slug).catch(
        () => null,
      );
    }
  }
}

export async function createArticleAction(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const admin = await requireAdmin();

  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    authorName: formData.get("authorName") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const img = await handleCoverImage(formData);
  if (!img.ok) return { ok: false, error: img.error };

  const intent = formData.get("intent") === "publish" ? "published" : "draft";
  const slug = await uniqueSlug(parsed.data.title);

  const [created] = await db
    .insert(articles)
    .values({
      title: parsed.data.title,
      slug,
      category: parsed.data.category,
      excerpt: parsed.data.excerpt,
      body: parsed.data.body,
      authorName: parsed.data.authorName || "Dott. Carlo Poggioli",
      coverImageUrl: img.dataUrl,
      status: intent,
      publishedAt: intent === "published" ? new Date() : null,
      createdBy: admin.id,
    })
    .returning();

  if (intent === "published") {
    await notifySubscribers(created.id);
  }

  revalidatePath("/admin/magazine");
  revalidatePath("/magazine");
  revalidatePath("/prenota");
  redirect("/admin/magazine");
}

export async function updateArticleAction(
  articleId: string,
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireAdmin();

  const [existing] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!existing) return { ok: false, error: "Articolo non trovato." };

  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    authorName: formData.get("authorName") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const img = await handleCoverImage(formData);
  if (!img.ok) return { ok: false, error: img.error };

  const intent = formData.get("intent") === "publish" ? "published" : "draft";
  const wasPublished = existing.status === "published";

  await db
    .update(articles)
    .set({
      title: parsed.data.title,
      category: parsed.data.category,
      excerpt: parsed.data.excerpt,
      body: parsed.data.body,
      authorName: parsed.data.authorName || "Dott. Carlo Poggioli",
      ...(img.dataUrl ? { coverImageUrl: img.dataUrl } : {}),
      status: intent,
      publishedAt: intent === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, articleId));

  if (intent === "published" && !wasPublished) {
    await notifySubscribers(articleId);
  }

  revalidatePath("/admin/magazine");
  revalidatePath("/magazine");
  revalidatePath(`/magazine/${existing.slug}`);
  revalidatePath("/prenota");
  redirect("/admin/magazine");
}

export async function deleteArticleAction(articleId: string) {
  await requireAdmin();
  await db.delete(articles).where(eq(articles.id, articleId));
  revalidatePath("/admin/magazine");
  revalidatePath("/magazine");
  revalidatePath("/prenota");
  return { ok: true };
}
