const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

export function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init.headers || {})
    }
  });
}

export function parseArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export function projectFromRow(row, assetBaseUrl = "") {
  if (!row) {
    return null;
  }

  const coverImage = row.cover_image_key
    ? `${assetBaseUrl}${row.cover_image_key}`
    : "";

  return {
    slug: row.slug,
    title: row.title,
    kicker: row.kicker,
    summary: row.summary,
    description: row.description,
    tags: parseArray(row.tags),
    featured: Boolean(row.featured),
    sortOrder: row.sort_order,
    mediaType: row.media_type,
    mediaSrc: row.media_src,
    placeholder: row.placeholder,
    stack: parseArray(row.stack),
    responsibilities: parseArray(row.responsibilities),
    systemFlow: parseArray(row.system_flow),
    takeawayTitle: row.takeaway_title,
    takeawayBody: row.takeaway_body,
    codeTitle: row.code_title,
    codeExample: row.code_example,
    coverImageKey: row.cover_image_key,
    coverImage,
    published: Boolean(row.published),
    updatedAt: row.updated_at
  };
}

export async function requireAdmin(request, env) {
  const configuredToken = env.ADMIN_TOKEN;

  if (!configuredToken) {
    return null;
  }

  const provided = request.headers.get("x-admin-token");
  if (provided && provided === configuredToken) {
    return null;
  }

  return json({ error: "Unauthorized" }, { status: 401 });
}

export async function readPortfolio(env) {
  const siteRow = await env.DB.prepare(
    "SELECT value FROM site_content WHERE key = ?"
  )
    .bind("site")
    .first();

  const projectRows = await env.DB.prepare(
    `SELECT *
     FROM projects
     WHERE published = 1
     ORDER BY sort_order ASC, id ASC`
  ).all();

  const sitePayload = siteRow ? JSON.parse(siteRow.value) : { site: {}, projects: [] };
  const projects = (projectRows.results || []).map((row) =>
    projectFromRow(row, env.ASSET_BASE_URL || "")
  );

  return {
    site: sitePayload.site || {},
    projects
  };
}

export function normalizeProjectPayload(payload) {
  return {
    slug: String(payload.slug || "").trim(),
    title: String(payload.title || "").trim(),
    kicker: String(payload.kicker || "").trim(),
    summary: String(payload.summary || "").trim(),
    description: String(payload.description || "").trim(),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    featured: payload.featured ? 1 : 0,
    sortOrder: Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0,
    mediaType: String(payload.mediaType || "placeholder").trim(),
    mediaSrc: String(payload.mediaSrc || "").trim(),
    placeholder: String(payload.placeholder || "").trim(),
    stack: Array.isArray(payload.stack) ? payload.stack : [],
    responsibilities: Array.isArray(payload.responsibilities) ? payload.responsibilities : [],
    systemFlow: Array.isArray(payload.systemFlow) ? payload.systemFlow : [],
    takeawayTitle: String(payload.takeawayTitle || "").trim(),
    takeawayBody: String(payload.takeawayBody || "").trim(),
    codeTitle: String(payload.codeTitle || "").trim(),
    codeExample: String(payload.codeExample || ""),
    coverImageKey: String(payload.coverImageKey || "").trim(),
    published: payload.published === false ? 0 : 1
  };
}

export async function upsertProject(env, payload, originalSlug = null) {
  const project = normalizeProjectPayload(payload);

  if (!project.slug || !project.title || !project.summary) {
    return json(
      { error: "slug, title, and summary are required" },
      { status: 400 }
    );
  }

  await env.DB.prepare(
    `INSERT INTO projects (
      slug, title, kicker, summary, description, tags, featured, sort_order,
      media_type, media_src, placeholder, stack, responsibilities, system_flow,
      takeaway_title, takeaway_body, code_title, code_example, cover_image_key,
      published, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(slug) DO UPDATE SET
      slug = excluded.slug,
      title = excluded.title,
      kicker = excluded.kicker,
      summary = excluded.summary,
      description = excluded.description,
      tags = excluded.tags,
      featured = excluded.featured,
      sort_order = excluded.sort_order,
      media_type = excluded.media_type,
      media_src = excluded.media_src,
      placeholder = excluded.placeholder,
      stack = excluded.stack,
      responsibilities = excluded.responsibilities,
      system_flow = excluded.system_flow,
      takeaway_title = excluded.takeaway_title,
      takeaway_body = excluded.takeaway_body,
      code_title = excluded.code_title,
      code_example = excluded.code_example,
      cover_image_key = excluded.cover_image_key,
      published = excluded.published,
      updated_at = CURRENT_TIMESTAMP`
  )
    .bind(
      project.slug,
      project.title,
      project.kicker,
      project.summary,
      project.description,
      JSON.stringify(project.tags),
      project.featured,
      project.sortOrder,
      project.mediaType,
      project.mediaSrc,
      project.placeholder,
      JSON.stringify(project.stack),
      JSON.stringify(project.responsibilities),
      JSON.stringify(project.systemFlow),
      project.takeawayTitle,
      project.takeawayBody,
      project.codeTitle,
      project.codeExample,
      project.coverImageKey,
      project.published
    )
    .run();

  if (originalSlug && originalSlug !== project.slug) {
    await env.DB.prepare("DELETE FROM projects WHERE slug = ?")
      .bind(originalSlug)
      .run();
  }

  const row = await env.DB.prepare("SELECT * FROM projects WHERE slug = ?")
    .bind(project.slug)
    .first();

  return json({ project: projectFromRow(row, env.ASSET_BASE_URL || "") });
}
