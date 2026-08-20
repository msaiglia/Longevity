"use server";

import { hash } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "@/lib/validation";

export type RegisterState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const email = parsed.data.email.toLowerCase().trim();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return {
      ok: false,
      fieldErrors: { email: "Esiste già un account con questa email." },
    };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await db.insert(users).values({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email,
    phone: parsed.data.phone,
    passwordHash,
    role: "athlete",
    status: "pending",
  });

  return { ok: true };
}
