"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, List as ListIcon } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { formatSlotDate, formatSlotTime, isPast } from "@/lib/utils";
import {
  BookButton,
  WaitlistButton,
  ConfirmOfferButton,
  CancelBookingButton,
} from "@/components/booking-actions";

export type PreparedSlot = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  notes: string | null;
  capacity: number;
  spotsLeft: number;
  bookingId: string | null;
  wait: { id: string; status: "waiting" | "offered"; expiresAt: Date | null } | null;
};

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const weekdayShort = new Intl.DateTimeFormat("it-IT", { weekday: "short" });
const dayNum = new Intl.DateTimeFormat("it-IT", { day: "numeric" });
const monthLabel = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });

function SlotCard({ s, isAdmin }: { s: PreparedSlot; isAdmin: boolean }) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="font-display text-[15.5px] font-medium text-ink">
          {formatSlotTime(s.startsAt, s.endsAt)}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {s.spotsLeft > 0 ? (
            <Badge tone="leaf">
              {s.spotsLeft} {s.spotsLeft === 1 ? "posto libero" : "posti liberi"}
            </Badge>
          ) : (
            <Badge tone="amber">Al completo</Badge>
          )}
          {s.notes && <Badge tone="neutral">{s.notes}</Badge>}
        </div>
      </div>

      <div className="shrink-0 text-right">
        {isAdmin ? (
          <Badge tone="neutral">Vista staff</Badge>
        ) : s.bookingId ? (
          <div className="space-y-1.5">
            <Badge tone="ocean">Prenotato</Badge>
            <div>
              <CancelBookingButton bookingId={s.bookingId} />
            </div>
          </div>
        ) : s.wait?.status === "offered" && !isPast(s.wait.expiresAt!) ? (
          <div className="space-y-1.5">
            <Badge tone="leaf">Posto disponibile per te</Badge>
            <ConfirmOfferButton waitlistId={s.wait.id} />
          </div>
        ) : s.wait?.status === "waiting" ? (
          <Badge tone="neutral">In lista d&apos;attesa</Badge>
        ) : s.spotsLeft > 0 ? (
          <BookButton slotId={s.id} />
        ) : (
          <WaitlistButton slotId={s.id} />
        )}
      </div>
    </Card>
  );
}

export function BookingCalendarView({ slots, isAdmin = false }: { slots: PreparedSlot[]; isAdmin?: boolean }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    slots.length ? dateKey(slots[0].startsAt) : dateKey(new Date()),
  );
  const [monthOpen, setMonthOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = slots.length ? new Date(slots[0].startsAt) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const datesWithSlots = useMemo(() => new Set(slots.map((s) => dateKey(s.startsAt))), [slots]);

  const groups = useMemo(() => {
    const m = new Map<string, PreparedSlot[]>();
    for (const s of slots) {
      const label = formatSlotDate(s.startsAt);
      if (!m.has(label)) m.set(label, []);
      m.get(label)!.push(s);
    }
    return m;
  }, [slots]);

  const strip = useMemo(() => {
    const days: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 21; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const daySlots = slots.filter((s) => dateKey(s.startsAt) === selectedDate);

  const monthGrid = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7; // lunedì = 0
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startOffset);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [visibleMonth]);

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
        <button
          onClick={() => setView("list")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
            view === "list" ? "bg-ocean text-white" : "text-muted",
          )}
        >
          <ListIcon className="h-3.5 w-3.5" /> Lista
        </button>
        <button
          onClick={() => setView("calendar")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
            view === "calendar" ? "bg-ocean text-white" : "text-muted",
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" /> Calendario
        </button>
      </div>

      {view === "list" ? (
        <div className="space-y-8">
          {slots.length === 0 && (
            <Card className="text-center text-[13.5px] text-muted">
              Al momento non ci sono sessioni disponibili. Torna a controllare più tardi.
            </Card>
          )}
          {Array.from(groups.entries()).map(([dateLabel, daySlots]) => (
            <div key={dateLabel}>
              <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
                {dateLabel}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {daySlots.map((s) => (
                  <SlotCard key={s.id} s={s} isAdmin={isAdmin} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {strip.map((d) => {
                const key = dateKey(d);
                const active = key === selectedDate;
                const has = datesWithSlots.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    className={cn(
                      "flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center transition-colors",
                      active
                        ? "border-ocean bg-ocean text-white"
                        : has
                          ? "border-ocean/30 bg-sky-100 text-ink"
                          : "border-border text-muted",
                    )}
                  >
                    <span className="text-[10.5px] uppercase">{weekdayShort.format(d)}</span>
                    <span className="font-display text-[15px] font-medium">{dayNum.format(d)}</span>
                    {has && (
                      <span
                        className={cn(
                          "mt-0.5 h-1 w-1 rounded-full",
                          active ? "bg-white" : "bg-ocean",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setMonthOpen((v) => !v)}
              className="ml-2 shrink-0 rounded-lg border border-border p-2.5 text-muted hover:border-ocean hover:text-ocean"
              aria-label="Apri vista mese"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>

          {monthOpen && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={() =>
                    setVisibleMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                    )
                  }
                  className="rounded-lg p-1.5 text-muted hover:bg-sky-100 hover:text-ocean"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="font-display text-[14px] font-medium capitalize text-ink">
                  {monthLabel.format(visibleMonth)}
                </p>
                <button
                  onClick={() =>
                    setVisibleMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                    )
                  }
                  className="rounded-lg p-1.5 text-muted hover:bg-sky-100 hover:text-ocean"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
                  <span key={i} className="text-[11px] font-medium text-muted">
                    {d}
                  </span>
                ))}
                {monthGrid.map((d) => {
                  const key = dateKey(d);
                  const inMonth = d.getMonth() === visibleMonth.getMonth();
                  const has = datesWithSlots.has(key);
                  const active = key === selectedDate;
                  return (
                    <button
                      key={key}
                      disabled={!has}
                      onClick={() => {
                        setSelectedDate(key);
                        setMonthOpen(false);
                      }}
                      className={cn(
                        "flex h-9 flex-col items-center justify-center rounded-lg text-[12.5px]",
                        !inMonth && "text-border",
                        inMonth && !has && "text-muted/50",
                        inMonth && has && !active && "bg-sky-100 text-ocean-600 font-medium",
                        active && "bg-ocean text-white font-medium",
                      )}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          <div>
            <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
              {formatSlotDate(new Date(selectedDate + "T12:00:00"))}
            </h2>
            {daySlots.length === 0 ? (
              <Card className="text-center text-[13.5px] text-muted">
                Nessuna sessione disponibile in questo giorno.
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {daySlots.map((s) => (
                  <SlotCard key={s.id} s={s} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
