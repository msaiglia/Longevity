import { auth } from "@/auth";

export class AuthError extends Error {}

export async function requireAthlete() {
  const session = await auth();
  if (!session?.user) throw new AuthError("Devi accedere per continuare.");
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new AuthError("Devi accedere per continuare.");
  if (session.user.role !== "admin") {
    throw new AuthError("Operazione riservata allo staff.");
  }
  return session.user;
}
