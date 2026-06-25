import { json, projectFromRow, requireAdmin } from "../../_lib/portfolio.js";

function normalizeSlugs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((slug) => String(slug || "").trim())
    .filter(Boolean);
}

export async function onRequestPut(context) {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await context.request.json().catch(() => ({}));
  const slugs = normalizeSlugs(payload.slugs);
  const uniqueSlugs = new Set(slugs);

  if (!slugs.length) {
    return json({ error: "Project slugs are required" }, { status: 400 });
  }

  if (uniqueSlugs.size !== slugs.length) {
    return json({ error: "Project slugs must be unique" }, { status: 400 });
  }

  const placeholders = slugs.map(() => "?").join(", ");
  const row = await context.env.DB.prepare(
    `SELECT COUNT(*) AS count FROM projects WHERE slug IN (${placeholders})`
  )
    .bind(...slugs)
    .first();

  if (Number(row?.count || 0) !== slugs.length) {
    return json({ error: "One or more projects were not found" }, { status: 400 });
  }

  const statements = slugs.map((slug, index) =>
    context.env.DB.prepare(
      "UPDATE projects SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?"
    ).bind(index + 1, slug)
  );

  await context.env.DB.batch(statements);

  const rows = await context.env.DB.prepare(
    "SELECT * FROM projects WHERE published = 1 ORDER BY sort_order ASC, id ASC"
  ).all();

  return json({
    projects: (rows.results || []).map((projectRow) =>
      projectFromRow(projectRow, context.env.ASSET_BASE_URL || "")
    )
  });
}
