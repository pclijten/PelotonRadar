import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { assertCronSecret } from "@/app/api/_utils";
import { fetchStartlist, fetchResultForRider } from "@/lib/firstcycling";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const unauthorized = assertCronSecret(req);
  if (unauthorized) return unauthorized;

  const watches = await prisma.watch.findMany({
    include: { rider: true, race: true }
  });

  for (const w of watches) {
    const rider = w.rider;
    const race = w.race;

    // 1) Startlist detection (one-time)
    const existingEntry = await prisma.entry.findUnique({
      where: { riderId_raceId: { riderId: rider.id, raceId: race.id } }
    });

    if (!existingEntry) {
      try {
        const startlist = await fetchStartlist(race.fcRaceId, race.year);
        const found = startlist.some((r) => r.fcRiderId === rider.fcRiderId);
        if (found) {
          await prisma.entry.create({ data: { riderId: rider.id, raceId: race.id } });
          await sendEmail(
            `Startlijst: ${rider.name} start in ${race.name} (${race.year})`,
            `${rider.name} staat op de startlijst van ${race.name} (${race.year}).`
          );
        }
      } catch {
        // ignore transient scrape errors
      }
    }

    // 2) Results detection / update
    try {
      const res = await fetchResultForRider(race.fcRaceId, race.year, rider.fcRiderId);
      if (res.position) {
        const existingRes = await prisma.result.findUnique({
          where: { riderId_raceId: { riderId: rider.id, raceId: race.id } }
        });

        if (!existingRes) {
          await prisma.result.create({
            data: {
              riderId: rider.id,
              raceId: race.id,
              position: res.position,
              status: res.status
            }
          });
          await sendEmail(
            `Uitslag: ${rider.name} in ${race.name} (${race.year})`,
            `Resultaat: ${res.position}${res.status ? ` (${res.status})` : ""}`
          );
        } else if (existingRes.position !== res.position || (res.status && existingRes.status !== res.status)) {
          await prisma.result.update({
            where: { riderId_raceId: { riderId: rider.id, raceId: race.id } },
            data: { position: res.position, status: res.status, updatedAt: new Date() }
          });
          await sendEmail(
            `Update uitslag: ${rider.name} in ${race.name} (${race.year})`,
            `Nieuwe uitslag: ${res.position}${res.status ? ` (${res.status})` : ""}`
          );
        }
      }
    } catch {
      // ignore transient scrape errors
    }
  }

  return Response.json({ ok: true, watched: watches.length });
}

// Vercel Cron hits GET by default in some setups; support GET too.
export async function GET(req: NextRequest) {
  return POST(req);
}
