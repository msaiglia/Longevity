import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAthlete } from "@/lib/guards";
import { Card } from "@/components/ui/primitives";
import { NotificationPrefsForm } from "@/components/notification-prefs-form";

export const dynamic = "force-dynamic";

export default async function ProfiloPage() {
  const sessionUser = await requireAthlete();
  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-medium text-navy">Il mio profilo</h1>
      </div>

      <Card>
        <p className="text-[14px] font-medium text-navy">
          {user.firstName} {user.lastName}
        </p>
        <p className="mt-0.5 text-[13px] text-muted">{user.email}</p>
        <p className="text-[13px] text-muted">{user.phone}</p>
      </Card>

      <div>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted">
          Preferenze di notifica
        </h2>
        <NotificationPrefsForm
          notifyEmailBookings={user.notifyEmailBookings}
          notifyEmailMessages={user.notifyEmailMessages}
        />
      </div>
    </div>
  );
}
