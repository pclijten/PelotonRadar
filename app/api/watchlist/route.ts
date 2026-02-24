import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.riderId || !body?.raceId) return new Response("Missing riderId/raceId", { status: 400 });

  const watch = await prisma.watch.create({
    data: { riderId: Number(body.riderId), raceId: Number(body.raceId) }
  });
  return Response.json(watch);
}
