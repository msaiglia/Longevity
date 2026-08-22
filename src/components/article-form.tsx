"use client";

import { useActionState, useState } from "react";
import { marked } from "marked";
import { Label, Input, Textarea, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ArticleFormState } from "@/actions/articles";

const categories = [
  { value: "allenamento", label: "Allenamento" },
  { value: "nutrizione", label: "Nutrizione" },
  { value: "prevenzione", label: "Prevenzione" },
  { value: "recupero", label: "Recupero" },
  { value: "novita", label: "Novità" },
];

export function ArticleForm({
  action,
  initial,
}: {
  action: (prev: ArticleFormState, formData: FormData) => Promise<ArticleFormState>;
  initial?: {
    title: string;
    category: string;
    excerpt: string;
    body: string;
    authorName: string;
    coverImageUrl: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const [body, setBody] = useState(initial?.body ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [intent, setIntent] = useState<"draft" | "publish">("draft");

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(e) => {
        const btn = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (btn?.name === "intent") {
          setIntent(btn.value as "draft" | "publish");
        }
      }}
    >
      <div>
        <Label htmlFor="title">Titolo</Label>
        <Input id="title" name="title" defaultValue={initial?.title} required />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select id="category" name="category" defaultValue={initial?.category ?? "allenamento"}>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="authorName">Autore</Label>
          <Input
            id="authorName"
            name="authorName"
            defaultValue={initial?.authorName ?? "Dott. Carlo Poggioli"}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="excerpt">Estratto (mostrato nelle anteprime)</Label>
        <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={initial?.excerpt} required />
      </div>

      <div>
        <Label htmlFor="coverImage">Immagine di copertina {initial ? "(lascia vuoto per non cambiarla)" : ""}</Label>
        {initial?.coverImageUrl && (
          <img src={initial.coverImageUrl} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />
        )}
        <Input id="coverImage" name="coverImage" type="file" accept="image/*" />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label htmlFor="body">
            Testo (formato semplice: **grassetto**, elenchi con -, titoli con ##)
          </Label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-[12.5px] font-medium text-ocean hover:underline"
          >
            {showPreview ? "Modifica" : "Anteprima"}
          </button>
        </div>
        {showPreview ? (
          <div
            className="min-h-[220px] rounded-lg border border-border bg-background p-3 text-[13.5px] leading-relaxed [&_h2]:mt-3 [&_h2]:font-display [&_h2]:text-[16px] [&_h2]:font-medium [&_h2]:text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: marked.parse(body || "*Niente da mostrare.*") as string }}
          />
        ) : (
          <Textarea
            id="body"
            name="body"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        )}
      </div>

      {state.error && <p className="text-[12.5px] text-red">{state.error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" name="intent" value="draft" variant="secondary" disabled={pending}>
          {pending && intent === "draft" ? "Salvataggio..." : "Salva bozza"}
        </Button>
        <Button type="submit" name="intent" value="publish" disabled={pending}>
          {pending && intent === "publish" ? "Pubblicazione..." : "Pubblica"}
        </Button>
      </div>
    </form>
  );
}
