"use client";

import { useTransition } from "react";
import { updateNotificationPrefsAction } from "@/actions/preferences";
import { Button } from "@/components/ui/button";

export function NotificationPrefsForm({
  notifyEmailBookings,
  notifyEmailMessages,
}: {
  notifyEmailBookings: boolean;
  notifyEmailMessages: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => { void updateNotificationPrefsAction(fd); })}
      className="space-y-3"
    >
      <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <span className="text-[13.5px] text-ink">Email per conferme e promemoria prenotazioni</span>
        <input
          type="checkbox"
          name="notifyEmailBookings"
          defaultChecked={notifyEmailBookings}
          className="h-4 w-4 accent-ocean"
        />
      </label>
      <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <span className="text-[13.5px] text-ink">Email per nuove comunicazioni dello staff</span>
        <input
          type="checkbox"
          name="notifyEmailMessages"
          defaultChecked={notifyEmailMessages}
          className="h-4 w-4 accent-ocean"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Salvataggio..." : "Salva preferenze"}
      </Button>
    </form>
  );
}
