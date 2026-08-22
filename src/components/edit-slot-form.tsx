"use client";

import { useActionState } from "react";
import { updateSlotAction } from "@/actions/admin-slots";
import { Label, Input, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}
function toTimeInput(d: Date) {
  return d.toISOString().slice(11, 16);
}

export function EditSlotForm({
  slotId,
  startsAt,
  endsAt,
  capacity,
  notes,
  cancelWindowHours,
  onDone,
}: {
  slotId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  notes: string | null;
  cancelWindowHours: number;
  onDone: () => void;
}) {
  const action = updateSlotAction.bind(null, slotId);
  const [state, formAction, pending] = useActionState(action, { ok: false });

  if (state.ok) {
    onDone();
  }

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={`date-${slotId}`}>Data</Label>
        <Input id={`date-${slotId}`} name="date" type="date" defaultValue={toDateInput(startsAt)} required />
      </div>
      <div>
        <Label htmlFor={`capacity-${slotId}`}>Capienza</Label>
        <Input
          id={`capacity-${slotId}`}
          name="capacity"
          type="number"
          min={1}
          defaultValue={capacity}
          required
        />
      </div>
      <div>
        <Label htmlFor={`start-${slotId}`}>Inizio</Label>
        <Input id={`start-${slotId}`} name="startTime" type="time" defaultValue={toTimeInput(startsAt)} required />
      </div>
      <div>
        <Label htmlFor={`end-${slotId}`}>Fine</Label>
        <Input id={`end-${slotId}`} name="endTime" type="time" defaultValue={toTimeInput(endsAt)} required />
      </div>
      <div>
        <Label htmlFor={`cancel-${slotId}`}>Finestra minima di cancellazione (ore)</Label>
        <Input
          id={`cancel-${slotId}`}
          name="cancelWindowHours"
          type="number"
          min={0}
          max={72}
          defaultValue={cancelWindowHours}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`notes-${slotId}`}>Note (facoltative)</Label>
        <Textarea id={`notes-${slotId}`} name="notes" rows={2} defaultValue={notes ?? ""} />
      </div>
      {state.error && <p className="text-[12.5px] text-red sm:col-span-2">{state.error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvataggio..." : "Salva modifiche"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onDone}>
          Annulla
        </Button>
      </div>
    </form>
  );
}
