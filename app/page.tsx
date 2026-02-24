export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>PelotonRadar</h1>
      <p>Backend is live. Use the API endpoints below:</p>
      <ul>
        <li>POST /api/riders</li>
        <li>GET /api/riders</li>
        <li>POST /api/races</li>
        <li>GET /api/races</li>
        <li>POST /api/watchlist</li>
        <li>GET /api/riders/&lt;id&gt;/history</li>
        <li>POST /api/run-check (called by Vercel Cron)</li>
      </ul>
      <p>
        Tip: protect /api/run-check with CRON_SECRET, and set it as a header <code>x-cron-secret</code>.
      </p>
    </main>
  );
}
