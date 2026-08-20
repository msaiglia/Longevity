"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction, joinWaitlistAction, confirmWaitlistOfferAction, cancelBookingAction } from "@/actions/bookings";
import { Button } from "@/components/ui/button";

function useActionRunner(fn: () => Promise<{ ok: boolean; error?: string }>) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Si è verificato un errore.");
      } else {
        router.refresh();
      }
    });
  }

  return { run, pending, error };
}

export function BookButton({ slotId }: { slotId: string }) {
  const { run, pending, error } = useActionRunner(() => createBookingAction(slotId));
  return (
    <div>
      <Button size="sm" onClick={run} disabled={pending}>
        {pending ? "..." : "Prenota"}
      </Button>
      {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
    </div>
  );
}

export function WaitlistButton({ slotId }: { slotId: string }) {
  const { run, pending, error } = useActionRunner(() => joinWaitlistAction(slotId));
  return (
    <div>
      <Button size="sm" variant="secondary" onClick={run} disabled={pending}>
        {pending ? "..." : "Iscriviti in lista d'attesa"}
      </Button>
      {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
    </div>
  );
}

export function ConfirmOfferButton({ waitlistId }: { waitlistId: string }) {
  const { run, pending, error } = useActionRunner(() => confirmWaitlistOfferAction(waitlistId));
  return (
    <div>
      <Button size="sm" onClick={run} disabled={pending}>
        {pending ? "..." : "Conferma il posto"}
      </Button>
      {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
    </div>
  );
}

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const { run, pending, error } = useActionRunner(() => cancelBookingAction(bookingId));
  return (
    <div>
      <Button size="sm" variant="danger" onClick={run} disabled={pending}>
        {pending ? "..." : "Cancella"}
      </Button>
      {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
    </div>
  );
}
