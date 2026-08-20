"use client";

import { useActionState, useState } from "react";
import { submitFeedbackAction, FeedbackFormState } from "@/actions/feedback";
import { Button } from "@/components/ui/button";

const initial: FeedbackFormState = { ok: false };

export function FeedbackForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(submitFeedbackAction, initial);
  const [rating, setRating] = useState(0);

  if (state.ok) {
    return <p className="text-[12.5px] text-leaf">Grazie per il tuo feedback.</p>;
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} stelle`}
            className={`text-[16px] leading-none ${n <= rating ? "text-amber" : "text-border"}`}
          >
            ★
          </button>
        ))}
      </div>
      <Button size="sm" variant="secondary" type="submit" disabled={pending || rating === 0}>
        {pending ? "..." : "Invia"}
      </Button>
      {state.error && <span className="text-[12px] text-red">{state.error}</span>}
    </form>
  );
}
