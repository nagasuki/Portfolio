import { mkdir, readFile, writeFile } from "node:fs/promises";

const raw = await readFile(new URL("../data/site.json", import.meta.url), "utf8");
const payload = JSON.parse(raw);

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function array(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

const statements = [];

statements.push("DELETE FROM site_content;");
statements.push("DELETE FROM projects;");
statements.push(
  `INSERT INTO site_content (key, value, updated_at) VALUES ('site', ${quote(
    JSON.stringify({ site: payload.site })
  )}, CURRENT_TIMESTAMP);`
);

for (const project of payload.projects || []) {
  statements.push(
    `INSERT INTO projects (
      slug, title, kicker, summary, description, tags, featured, sort_order,
      media_type, media_src, placeholder, stack, responsibilities, system_flow,
      takeaway_title, takeaway_body, code_title, code_example, cover_image_key,
      published, updated_at
    ) VALUES (
      ${quote(project.slug)},
      ${quote(project.title)},
      ${quote(project.kicker)},
      ${quote(project.summary)},
      ${quote(project.description)},
      ${quote(array(project.tags))},
      ${project.featured ? 1 : 0},
      ${Number(project.sortOrder || 0)},
      ${quote(project.mediaType || "placeholder")},
      ${quote(project.mediaSrc || "")},
      ${quote(project.placeholder || "")},
      ${quote(array(project.stack))},
      ${quote(array(project.responsibilities))},
      ${quote(array(project.systemFlow))},
      ${quote(project.takeawayTitle || "")},
      ${quote(project.takeawayBody || "")},
      ${quote(project.codeTitle || "")},
      ${quote(project.codeExample || "")},
      ${quote(project.coverImageKey || "")},
      ${project.published === false ? 0 : 1},
      CURRENT_TIMESTAMP
    );`
  );
}

await mkdir(new URL("../.tmp/", import.meta.url), { recursive: true });
await writeFile(new URL("../.tmp/seed.sql", import.meta.url), statements.join("\n\n"));
