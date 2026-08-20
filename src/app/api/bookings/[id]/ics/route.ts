import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, slots } from "@/db/schema";
import { eq } from "drizzle-orm";

function toICSDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new NextResponse("Non autorizzato", { status: 401 });

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!booking || booking.userId !== session.user.id) {
    return new NextResponse("Non trovato", { status: 404 });
  }

  const [slot] = await db.select().from(slots).where(eq(slots.id, booking.slotId)).limit(1);
  if (!slot) return new NextResponse("Non trovato", { status: 404 });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Longevity//Booking//IT",
    "BEGIN:VEVENT",
    `UID:${booking.id}@longevity`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(slot.startsAt)}`,
    `DTEND:${toICSDate(slot.endsAt)}`,
    "SUMMARY:Sessione Longevity",
    "DESCRIPTION:Corso Longevity — Dott. Carlo Poggioli",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="longevity-sessione.ics"`,
    },
  });
}
