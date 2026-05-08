import {
  json,
  projectFromRow,
  requireAdmin,
  upsertProject
} from "../_lib/portfolio.js";

function extractSlug(params) {
  return Array.isArray(params.slug) ? params.slug[0] : params.slug;
}

export async function onRequestGet(context) {
  const slug = extractSlug(context.params);

  if (!slug) {
    const rows = await context.env.DB.prepare(
      "SELECT * FROM projects ORDER BY sort_order ASC, id ASC"
    ).all();

    return json({
      projects: (rows.results || []).map((row) =>
        projectFromRow(row, context.env.ASSET_BASE_URL || "")
      )
    });
  }

  const row = await context.env.DB.prepare("SELECT * FROM projects WHERE slug = ?")
    .bind(slug)
    .first();

  if (!row) {
    return json({ error: "Project not found" }, { status: 404 });
  }

  return json({
    project: projectFromRow(row, context.env.ASSET_BASE_URL || "")
  });
}

export async function onRequestPost(context) {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await context.request.json();
  return upsertProject(context.env, payload);
}

export async function onRequestPut(context) {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await context.request.json();
  const slug = extractSlug(context.params);
  return upsertProject(context.env, payload, slug);
}

export async function onRequestDelete(context) {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }

  const slug = extractSlug(context.params);
  if (!slug) {
    return json({ error: "Project slug is required" }, { status: 400 });
  }

  await context.env.DB.prepare("DELETE FROM projects WHERE slug = ?")
    .bind(slug)
    .run();

  return json({ ok: true });
}
