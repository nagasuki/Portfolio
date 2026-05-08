CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  kicker TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  media_type TEXT NOT NULL DEFAULT 'placeholder',
  media_src TEXT NOT NULL DEFAULT '',
  placeholder TEXT NOT NULL DEFAULT '',
  stack TEXT NOT NULL DEFAULT '[]',
  responsibilities TEXT NOT NULL DEFAULT '[]',
  system_flow TEXT NOT NULL DEFAULT '[]',
  takeaway_title TEXT NOT NULL DEFAULT '',
  takeaway_body TEXT NOT NULL DEFAULT '',
  code_title TEXT NOT NULL DEFAULT '',
  code_example TEXT NOT NULL DEFAULT '',
  cover_image_key TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured, published);
