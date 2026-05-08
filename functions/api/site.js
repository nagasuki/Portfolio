import { json, requireAdmin } from "./_lib/portfolio.js";

export async function onRequestGet(context) {
  const row = await context.env.DB.prepare(
    "SELECT value FROM site_content WHERE key = ?"
  )
    .bind("site")
    .first();

  return json(row ? JSON.parse(row.value) : { site: {} });
}

export async function onRequestPut(context) {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await context.request.json();

  await context.env.DB.prepare(
    `INSERT INTO site_content (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind("site", JSON.stringify({ site: payload.site || payload }))
    .run();

  return json({ ok: true });
}
