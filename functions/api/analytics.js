import { json, requireAdmin } from "./_lib/portfolio.js";

const SITE_VIEW_KEY = "site:home";
const PROJECT_SLUG_PATTERN = /^[a-z0-9-]+$/;

async function ensureAnalyticsSchema(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS analytics_counts (
      metric_key TEXT PRIMARY KEY,
      metric_type TEXT NOT NULL,
      slug TEXT NOT NULL DEFAULT '',
      label TEXT NOT NULL DEFAULT '',
      count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();

  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_analytics_counts_type ON analytics_counts(metric_type, slug)"
  ).run();
}

async function incrementMetric(env, metric) {
  await ensureAnalyticsSchema(env);

  await env.DB.prepare(
    `INSERT INTO analytics_counts (metric_key, metric_type, slug, label, count, updated_at)
     VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(metric_key) DO UPDATE SET
       count = count + 1,
       label = excluded.label,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(metric.key, metric.type, metric.slug || "", metric.label || "")
    .run();
}

function metricFromPayload(payload) {
  const type = String(payload?.type || "").trim();

  if (type === "site_view") {
    return {
      key: SITE_VIEW_KEY,
      type: "site_view",
      label: "Homepage"
    };
  }

  if (type === "project_view") {
    const slug = String(payload?.slug || "").trim();
    if (!PROJECT_SLUG_PATTERN.test(slug)) {
      return null;
    }

    return {
      key: `project:${slug}`,
      type: "project_view",
      slug,
      label: String(payload?.label || slug).trim()
    };
  }

  return null;
}

export async function onRequestGet(context) {
  try {
    const unauthorized = await requireAdmin(context.request, context.env);
    if (unauthorized) {
      return unauthorized;
    }

    await ensureAnalyticsSchema(context.env);

    const siteRow = await context.env.DB.prepare(
      "SELECT count, updated_at FROM analytics_counts WHERE metric_key = ?"
    )
      .bind(SITE_VIEW_KEY)
      .first();

    const projectRows = await context.env.DB.prepare(
      `SELECT
        projects.slug,
        projects.title,
        COALESCE(analytics_counts.count, 0) AS count,
        analytics_counts.updated_at AS updated_at
       FROM projects
       LEFT JOIN analytics_counts
         ON analytics_counts.metric_key = 'project:' || projects.slug
       WHERE projects.published = 1
       ORDER BY projects.sort_order ASC, projects.id ASC`
    ).all();

    const projectViews = (projectRows.results || []).map((row) => ({
      slug: row.slug,
      title: row.title,
      count: row.count || 0,
      updatedAt: row.updated_at || ""
    }));

    return json({
      siteViews: siteRow?.count || 0,
      siteUpdatedAt: siteRow?.updated_at || "",
      totalProjectViews: projectViews.reduce((sum, project) => sum + project.count, 0),
      projectViews
    });
  } catch (error) {
    return json(
      {
        error: "Failed to load analytics",
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json().catch(() => ({}));
    const metric = metricFromPayload(payload);

    if (!metric) {
      return json({ error: "Invalid analytics event" }, { status: 400 });
    }

    await incrementMetric(context.env, metric);
    return json({ ok: true });
  } catch (error) {
    return json(
      {
        error: "Failed to track analytics event",
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
