"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { sendMessageAction, MessageFormState } from "@/actions/messages";
import { Label, Input, Textarea, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

const initial: MessageFormState = { ok: false };

export function SendMessageForm({
  athletes,
}: {
  athletes: { id: string; firstName: string; lastName: string }[];
}) {
  const [state, formAction, pending] = useActionState(sendMessageAction, initial);
  const [audience, setAudience] = useState<"all" | "single">("all");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="title">Titolo</Label>
        <Input id="title" name="title" required placeholder="Es. Sessione di venerdì annullata" />
      </div>
      <div>
        <Label htmlFor="body">Messaggio</Label>
        <Textarea id="body" name="body" rows={3} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="priority">Priorità</Label>
          <Select id="priority" name="priority" defaultValue="info">
            <option value="info">Informativo</option>
            <option value="important">Importante</option>
            <option value="urgent">Urgente</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="audience">Destinatari</Label>
          <Select
            id="audience"
            name="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value as "all" | "single")}
          >
            <option value="all">Tutti gli atleti approvati</option>
            <option value="single">Un singolo atleta</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="expiresAt">Scadenza (facoltativa)</Label>
        <Input id="expiresAt" name="expiresAt" type="date" />
        <p className="mt-1 text-[12px] text-muted">
          Dopo questa data il messaggio non comparirà più tra le comunicazioni in evidenza.
        </p>
      </div>
      {audience === "single" && (
        <div>
          <Label htmlFor="userId">Atleta</Label>
          <Select id="userId" name="userId" required>
            <option value="">Seleziona...</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.firstName} {a.lastName}
              </option>
            ))}
          </Select>
        </div>
      )}
      <label className="flex items-center gap-2 text-[13px] text-ink">
        <input type="checkbox" name="notifyByEmail" className="h-4 w-4 accent-ocean" />
        Invia anche una notifica email
      </label>
      {state.error && <p className="text-[12.5px] text-red">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Invio..." : "Invia comunicazione"}
      </Button>
    </form>
  );
}
