"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createSlotAction, SlotFormState } from "@/actions/admin-slots";
import { Label, Input, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initial: SlotFormState = { ok: false };

const weekdays = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Gio" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" },
];

export function CreateSlotForm() {
  const [state, formAction, pending] = useActionState(createSlotAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [recurring, setRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setSelectedDays([]);
    }
  }, [state.ok]);

  function toggleDay(d: number) {
    setSelectedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <label className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
        <input
          type="checkbox"
          name="recurring"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="h-4 w-4 accent-ocean"
        />
        Ripeti settimanalmente
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {recurring ? (
          <>
            <div>
              <Label htmlFor="startDate">Dal</Label>
              <Input id="startDate" name="startDate" type="date" required={recurring} />
            </div>
            <div>
              <Label htmlFor="endDate">Al</Label>
              <Input id="endDate" name="endDate" type="date" required={recurring} />
            </div>
            <div className="sm:col-span-2">
              <Label>Giorni della settimana</Label>
              <div className="flex flex-wrap gap-1.5">
                {weekdays.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
                      selectedDays.includes(d.value)
                        ? "border-ocean bg-ocean text-white"
                        : "border-border text-muted hover:border-ocean hover:text-ocean",
                    )}
                  >
                    {d.label}
                    {selectedDays.includes(d.value) && (
                      <input type="hidden" name="daysOfWeek" value={d.value} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" required={!recurring} />
          </div>
        )}

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
        {state.ok && state.created && state.created > 1 && (
          <p className="text-[12.5px] text-leaf sm:col-span-2">
            Create {state.created} sessioni.
          </p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending || (recurring && selectedDays.length === 0)}>
            {pending ? "Creazione..." : recurring ? "Crea sessioni ricorrenti" : "Crea sessione"}
          </Button>
        </div>
      </div>
    </form>
  );
}
