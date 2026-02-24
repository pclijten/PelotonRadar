import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const riders = await prisma.rider.findMany({ orderBy: { id: "asc" } });
  return Response.json(riders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name || !body?.fcRiderId) return new Response("Missing name/fcRiderId", { status: 400 });

  const rider = await prisma.rider.create({
    data: { name: String(body.name), fcRiderId: Number(body.fcRiderId) }
  });
  return Response.json(rider);
}
