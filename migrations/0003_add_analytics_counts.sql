CREATE TABLE IF NOT EXISTS analytics_counts (
  metric_key TEXT PRIMARY KEY,
  metric_type TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_counts_type ON analytics_counts(metric_type, slug);
