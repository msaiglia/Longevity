"use client";

import { useTransition } from "react";
import { markMessageReadAction } from "@/actions/messages";
import { Button } from "@/components/ui/button";

export function MarkReadButton({ messageId }: { messageId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => { void markMessageReadAction(messageId); })}
    >
      {pending ? "..." : "Letto"}
    </Button>
  );
}
