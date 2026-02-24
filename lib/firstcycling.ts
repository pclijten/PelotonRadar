import * as cheerio from "cheerio";

/**
 * Startlist (mobile) example:
 * https://firstcycling.com/m/race.php?k=start&r=17&y=2025
 *
 * Results (desktop) example:
 * https://firstcycling.com/race.php?k=8&r=59&y=2023
 *
 * These URL patterns are observed on FirstCycling. Use sparingly (rate-limit).
 */
export async function fetchStartlist(fcRaceId: number, year: number) {
  const url = `https://firstcycling.com/m/race.php?k=start&r=${fcRaceId}&y=${year}`;
  const res = await fetch(url, { headers: { "user-agent": "PelotonRadar/0.1 (+vercel)" } });
  if (!res.ok) throw new Error(`Startlist fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // On /m pages, riders are anchors; we parse hrefs like rider.php?r=58275 (mobile) or ..../rider.php?r=...
  const riders: { name: string; fcRiderId: number }[] = [];
  $("a").each((_, a) => {
    const href = $(a).attr("href") || "";
    const text = $(a).text().trim();
    const m = href.match(/rider\.php\?r=(\d+)/);
    if (m && text) {
      riders.push({ name: text, fcRiderId: parseInt(m[1], 10) });
    }
  });

  // De-dup by id
  const map = new Map<number, string>();
  for (const r of riders) if (!map.has(r.fcRiderId)) map.set(r.fcRiderId, r.name);
  return Array.from(map.entries()).map(([fcRiderId, name]) => ({ fcRiderId, name, url }));
}

export async function fetchResultForRider(fcRaceId: number, year: number, fcRiderId: number) {
  const url = `https://firstcycling.com/race.php?k=8&r=${fcRaceId}&y=${year}`;
  const res = await fetch(url, { headers: { "user-agent": "PelotonRadar/0.1 (+vercel)" } });
  if (!res.ok) throw new Error(`Results fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Results table contains rider links. We find the row where rider link matches riderId.
  let position: string | null = null;
  let status: string | null = null;

  const selector = `a[href*="rider.php?r=${fcRiderId}"]`;
  const link = $(selector).first();
  if (!link.length) return { position, status, url };

  // Typically position is in the first text node of the parent row/cell.
  const row = link.closest("tr");
  if (row.length) {
    const cells = row.find("td").toArray().map((td) => $(td).text().trim());
    // Heuristic: first cell contains position.
    if (cells.length) position = cells[0] || null;
    // Optional status: sometimes in same cell or last cell; keep basic.
  } else {
    // Fallback: parse preceding text
    const parentText = link.parent().text().trim();
    // parentText often "1  Pogacar Tadej" - grab leading number
    const m = parentText.match(/^(\d+)/);
    if (m) position = m[1];
  }

  return { position, status, url };
}
