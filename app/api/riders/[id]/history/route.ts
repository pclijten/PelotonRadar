import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const riderId = Number(params.id);
  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider) return new Response("Rider not found", { status: 404 });

  const entries = await prisma.entry.findMany({ where: { riderId }, include: { race: true } });
  const results = await prisma.result.findMany({ where: { riderId }, include: { race: true } });

  // merge by raceId
  const map = new Map<number, any>();
  for (const e of entries) {
    map.set(e.raceId, {
      race: { id: e.race.id, name: e.race.name, year: e.race.year },
      started: true,
      startDetectedAt: e.detectedAt,
      resultPosition: null,
      resultStatus: null,
      resultUpdatedAt: null
    });
  }
  for (const r of results) {
    const cur = map.get(r.raceId) || {
      race: { id: r.race.id, name: r.race.name, year: r.race.year },
      started: false,
      startDetectedAt: null,
      resultPosition: null,
      resultStatus: null,
      resultUpdatedAt: null
    };
    cur.resultPosition = r.position;
    cur.resultStatus = r.status;
    cur.resultUpdatedAt = r.updatedAt;
    map.set(r.raceId, cur);
  }

  return Response.json({ rider: { id: rider.id, name: rider.name }, history: Array.from(map.values()) });
}
