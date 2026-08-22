"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAttendanceAction } from "@/actions/checkin";
import { cancelSlotAction } from "@/actions/admin-slots";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { EditSlotForm } from "@/components/edit-slot-form";

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
    <div className="flex flex-wrap items-center gap-1.5">
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

export function SessionActions({
  slotId,
  startsAt,
  endsAt,
  capacity,
  notes,
  cancelWindowHours,
}: {
  slotId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  notes: string | null;
  cancelWindowHours: number;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (editing) {
    return (
      <EditSlotForm
        slotId={slotId}
        startsAt={startsAt}
        endsAt={endsAt}
        capacity={capacity}
        notes={notes}
        cancelWindowHours={cancelWindowHours}
        onDone={() => {
          setEditing(false);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
        Modifica
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              "Eliminare questa sessione? Le prenotazioni attive verranno cancellate e gli iscritti avvisati via email.",
            )
          )
            return;
          startTransition(async () => {
            await cancelSlotAction(slotId);
            router.refresh();
          });
        }}
      >
        {pending ? "..." : "Elimina sessione"}
      </Button>
    </div>
  );
}
