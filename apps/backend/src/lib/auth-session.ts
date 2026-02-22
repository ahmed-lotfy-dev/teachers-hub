import type { Context } from "elysia";
import { auth } from "../auth";

type RouteContext = Pick<Context, "request" | "set">;

export async function requireAuthSession(context: RouteContext): Promise<{
  userId: string;
  email: string | null;
} | null> {
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (!session?.user?.id) {
    context.set.status = 401;
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? null,
  };
}
