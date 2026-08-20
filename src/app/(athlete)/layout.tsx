import { AthleteNav } from "@/components/athlete-nav";
import { AthleteTabBar } from "@/components/athlete-tabbar";
import { auth } from "@/auth";
import { db } from "@/db";
import { messageRecipients } from "@/db/schema";
import { and, eq, isNull, count } from "drizzle-orm";

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let hasUnread = false;

  if (session?.user) {
    const [row] = await db
      .select({ n: count() })
      .from(messageRecipients)
      .where(
        and(eq(messageRecipients.userId, session.user.id), isNull(messageRecipients.readAt)),
      );
    hasUnread = (row?.n ?? 0) > 0;
  }

  return (
    <div className="flex min-h-full flex-col">
      <AthleteNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 pb-24 md:pb-8">{children}</main>
      <AthleteTabBar hasUnread={hasUnread} />
    </div>
  );
}
