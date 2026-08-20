"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveUserAction, rejectUserAction } from "@/actions/admin-users";
import { Button } from "@/components/ui/button";

export function ApproveRejectButtons({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(async () => { await approveUserAction(userId); router.refresh(); })}
      >
        Approva
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(async () => { await rejectUserAction(userId); router.refresh(); })}
      >
        Rifiuta
      </Button>
    </div>
  );
}
