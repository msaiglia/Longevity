"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAttendanceAction } from "@/actions/checkin";
import { cancelSlotAction } from "@/actions/admin-slots";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";

export function AttendanceToggle({
  bookingId,
  status,
}: {
  bookingId: string;
  status: "confirmed" | "attended" | "no_show" | "cancelled";
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set(next: "attended" | "no_show" | "confirmed") {
    startTransition(async () => {
      await setAttendanceAction(bookingId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {status === "attended" ? (
        <Badge tone="leaf">Presente</Badge>
      ) : status === "no_show" ? (
        <Badge tone="red">Assente</Badge>
      ) : (
        <Badge tone="neutral">Da segnare</Badge>
      )}
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => set("attended")}>
        Presente
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => set("no_show")}>
        Assente
      </Button>
    </div>
  );
}

export function CancelSlotButton({ slotId }: { slotId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!confirm("Chiudere questa sessione? Le prenotazioni attive verranno cancellate e gli iscritti avvisati via email.")) return;
        startTransition(async () => {
          await cancelSlotAction(slotId);
          router.refresh();
        });
      }}
    >
      {pending ? "..." : "Chiudi sessione"}
    </Button>
  );
}
