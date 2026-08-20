"use client";

import { useActionState, useEffect, useRef } from "react";
import { createSlotAction, SlotFormState } from "@/actions/admin-slots";
import { Label, Input, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

const initial: SlotFormState = { ok: false };

export function CreateSlotForm() {
  const [state, formAction, pending] = useActionState(createSlotAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="date">Data</Label>
        <Input id="date" name="date" type="date" required />
      </div>
      <div>
        <Label htmlFor="capacity">Capienza</Label>
        <Input id="capacity" name="capacity" type="number" min={1} defaultValue={10} required />
      </div>
      <div>
        <Label htmlFor="startTime">Inizio</Label>
        <Input id="startTime" name="startTime" type="time" required />
      </div>
      <div>
        <Label htmlFor="endTime">Fine</Label>
        <Input id="endTime" name="endTime" type="time" required />
      </div>
      <div>
        <Label htmlFor="cancelWindowHours">Finestra minima di cancellazione (ore)</Label>
        <Input id="cancelWindowHours" name="cancelWindowHours" type="number" min={0} max={72} defaultValue={2} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Note (facoltative)</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Es. portare tappetino" />
      </div>
      {state.error && <p className="text-[12.5px] text-red sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creazione..." : "Crea sessione"}
        </Button>
      </div>
    </form>
  );
}
