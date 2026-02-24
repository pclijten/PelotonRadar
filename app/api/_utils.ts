import { NextRequest } from "next/server";

export function assertCronSecret(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return; // if not configured, allow
  const header = req.headers.get("x-cron-secret");
  if (header !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }
}
