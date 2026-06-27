function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchProject(slug) {
  try {
    const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`);
    if (!response.ok) {
      throw new Error(`Unable to load project: ${slug}`);
    }

    const payload = await response.json();
    return payload.project;
  } catch {
    const response = await fetch("./data/site.json");
    if (!response.ok) {
      throw new Error(`Unable to load project: ${slug}`);
    }

    const payload = await response.json();
    const project = (payload.projects || []).find((item) => item.slug === slug);
    if (!project) {
      throw new Error(`Unable to load project: ${slug}`);
    }

    return project;
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value || "";
  }
}

function renderList(id, items) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.innerHTML = (items || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function trackAnalyticsEvent(event) {
  try {
    const body = JSON.stringify(event);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }

    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body,
      keepalive: true
    }).catch(() => {});
  } catch {
    // Analytics must never block project rendering.
  }
}

function renderActions(project) {
  const element = document.getElementById("project-actions");
  if (!element) {
    return;
  }

  element.innerHTML = project.demoUrl
    ? `<a class="button button-primary" href="${escapeHtml(project.demoUrl)}" target="_blank" rel="noreferrer">Try Project</a>`
    : "";
}

function renderMedia(project) {
  const container = document.getElementById("project-media");
  if (!container) {
    return;
  }

  container.classList.remove("is-video");

  if (project.mediaType === "video" && project.mediaSrc) {
    container.classList.add("is-video");
    container.innerHTML = `
      <video controls muted playsinline preload="metadata" class="project-video-player">
        <source src="${escapeHtml(project.mediaSrc)}">
      </video>
    `;
    return;
  }

  if (project.mediaType === "embed" && project.mediaSrc) {
    container.innerHTML = `
      <iframe
        src="${escapeHtml(project.mediaSrc)}"
        title="${escapeHtml(project.title)}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    `;
    return;
  }

  if (project.mediaType === "image" && (project.coverImage || project.mediaSrc)) {
    container.innerHTML = `
      <img
        src="${escapeHtml(project.coverImage || project.mediaSrc)}"
        alt="${escapeHtml(project.title)}"
        class="showcase-cover-image"
      >
    `;
    return;
  }

  if (project.coverImage) {
    container.innerHTML = `
      <img
        src="${escapeHtml(project.coverImage)}"
        alt="${escapeHtml(project.title)}"
        class="showcase-cover-image"
      >
    `;
    return;
  }

  container.innerHTML = `
    <div class="placeholder-content">
      <span class="placeholder-label">${escapeHtml(project.placeholder || "Project Media")}</span>
      <h2 class="placeholder-title">${escapeHtml(project.title)}</h2>
      <p class="placeholder-caption">${escapeHtml(project.kicker)}</p>
    </div>
  `;
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    throw new Error("Missing project slug");
  }

  const project = await fetchProject(slug);

  document.title = `${project.title} | Case Study`;
  setText("project-kicker", `Case Study / ${project.kicker}`);
  setText("project-title", project.title);
  setText("project-description", project.description);
  setText("project-takeaway-title", project.takeawayTitle);
  setText("project-takeaway-body", project.takeawayBody);
  renderList("project-stack", project.stack);
  renderList("project-responsibilities", project.responsibilities);
  renderList("project-system-flow", project.systemFlow);
  renderActions(project);
  renderMedia(project);
  trackAnalyticsEvent({
    type: "project_view",
    slug: project.slug,
    label: project.title
  });
}

bootstrap().catch((error) => {
  console.error(error);
  setText("project-title", "Project not found");
  setText(
    "project-description",
    "This case study could not be loaded. Check that the slug exists in your database."
  );
});
