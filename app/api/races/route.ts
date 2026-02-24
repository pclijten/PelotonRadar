import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const races = await prisma.race.findMany({ orderBy: { id: "asc" } });
  return Response.json(races);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name || !body?.fcRaceId || !body?.year) return new Response("Missing name/fcRaceId/year", { status: 400 });

  const race = await prisma.race.create({
    data: { name: String(body.name), fcRaceId: Number(body.fcRaceId), year: Number(body.year) }
  });
  return Response.json(race);
}
