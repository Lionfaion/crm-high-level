import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export const getSession = () => getServerSession(authOptions);

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthenticated");
  return session;
}
