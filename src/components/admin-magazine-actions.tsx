"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteArticleAction } from "@/actions/articles";
import { Button } from "@/components/ui/button";

export function DeleteArticleButton({ articleId }: { articleId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!confirm("Eliminare questo articolo? L'operazione non è reversibile.")) return;
        startTransition(async () => {
          await deleteArticleAction(articleId);
          router.refresh();
        });
      }}
    >
      {pending ? "..." : "Elimina"}
    </Button>
  );
}
