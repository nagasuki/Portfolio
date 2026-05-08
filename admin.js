const state = {
  token: sessionStorage.getItem("portfolio-admin-token") || "",
  site: null,
  projects: [],
  selectedSlug: null
};

function linesToArray(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(items) {
  return (items || []).join("\n");
}

function setStatus(message, isError = false) {
  const status = document.getElementById("admin-status");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.dataset.error = isError ? "true" : "false";
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-admin-token": state.token,
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Request failed with ${response.status}`);
    }

    const text = await response.text().catch(() => "");
    throw new Error(
      text.includes("<!DOCTYPE")
        ? `Request failed with ${response.status}. API route returned HTML instead of JSON.`
        : `Request failed with ${response.status}`
    );
  }

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text.includes("<!DOCTYPE")
        ? "API route returned HTML instead of JSON. Check Pages Functions routing."
        : "API route did not return JSON."
    );
  }

  return response.json();
}

function renderProjectList() {
  const list = document.getElementById("project-list");
  if (!list) {
    return;
  }

  list.innerHTML = state.projects
    .map((project) => `
      <button
        type="button"
        class="admin-project-item${project.slug === state.selectedSlug ? " is-active" : ""}"
        data-slug="${project.slug}"
      >
        <strong>${project.title}</strong>
        <span>${project.slug}</span>
      </button>
    `)
    .join("");

  list.querySelectorAll("[data-slug]").forEach((button) => {
    button.addEventListener("click", () => {
      selectProject(button.dataset.slug);
    });
  });
}

function fillSiteForm() {
  const site = state.site || {};
  const hero = site.hero || {};
  const about = site.about || {};
  const contact = site.contact || {};

  document.getElementById("site-hero-eyebrow").value = hero.eyebrow || "";
  document.getElementById("site-first-name").value = hero.name?.first || "";
  document.getElementById("site-last-name").value = hero.name?.last || "";
  document.getElementById("site-hero-description").value = hero.description || "";
  document.getElementById("site-about-heading").value = about.heading || "";
  document.getElementById("site-profile-name").value = about.profileName || "";
  document.getElementById("site-profile-description").value = about.profileDescription || "";
  document.getElementById("site-contact-heading").value = contact.heading || "";
  document.getElementById("site-contact-description").value = contact.description || "";
}

function currentProject() {
  return state.projects.find((project) => project.slug === state.selectedSlug) || null;
}

function fillProjectForm(project) {
  const entry = project || {
    slug: "",
    title: "",
    kicker: "",
    summary: "",
    description: "",
    featured: true,
    sortOrder: state.projects.length + 1,
    mediaType: "placeholder",
    mediaSrc: "",
    placeholder: "",
    coverImageKey: "",
    tags: [],
    stack: [],
    responsibilities: [],
    systemFlow: [],
    takeawayTitle: "",
    takeawayBody: "",
    codeTitle: "",
    codeExample: ""
  };

  document.getElementById("editor-title").textContent = entry.title || "New project";
  document.getElementById("project-slug").value = entry.slug || "";
  document.getElementById("project-title-field").value = entry.title || "";
  document.getElementById("project-kicker-field").value = entry.kicker || "";
  document.getElementById("project-summary").value = entry.summary || "";
  document.getElementById("project-description-field").value = entry.description || "";
  document.getElementById("project-featured").value = String(entry.featured !== false);
  document.getElementById("project-sort-order").value = entry.sortOrder ?? 0;
  document.getElementById("project-media-type").value = entry.mediaType || "placeholder";
  document.getElementById("project-media-src").value = entry.mediaSrc || "";
  document.getElementById("project-placeholder").value = entry.placeholder || "";
  document.getElementById("project-cover-image-key").value = entry.coverImageKey || "";
  document.getElementById("project-tags").value = arrayToLines(entry.tags);
  document.getElementById("project-stack-field").value = arrayToLines(entry.stack);
  document.getElementById("project-responsibilities-field").value = arrayToLines(entry.responsibilities);
  document.getElementById("project-system-flow-field").value = arrayToLines(entry.systemFlow);
  document.getElementById("project-takeaway-title-field").value = entry.takeawayTitle || "";
  document.getElementById("project-takeaway-body-field").value = entry.takeawayBody || "";
  document.getElementById("project-code-title-field").value = entry.codeTitle || "";
  document.getElementById("project-code-example-field").value = entry.codeExample || "";
}

function selectProject(slug) {
  state.selectedSlug = slug;
  renderProjectList();
  fillProjectForm(currentProject());
}

function readProjectForm() {
  return {
    slug: document.getElementById("project-slug").value.trim(),
    title: document.getElementById("project-title-field").value.trim(),
    kicker: document.getElementById("project-kicker-field").value.trim(),
    summary: document.getElementById("project-summary").value.trim(),
    description: document.getElementById("project-description-field").value.trim(),
    featured: document.getElementById("project-featured").value === "true",
    sortOrder: Number(document.getElementById("project-sort-order").value || 0),
    mediaType: document.getElementById("project-media-type").value,
    mediaSrc: document.getElementById("project-media-src").value.trim(),
    placeholder: document.getElementById("project-placeholder").value.trim(),
    coverImageKey: document.getElementById("project-cover-image-key").value.trim(),
    tags: linesToArray(document.getElementById("project-tags").value),
    stack: linesToArray(document.getElementById("project-stack-field").value),
    responsibilities: linesToArray(document.getElementById("project-responsibilities-field").value),
    systemFlow: linesToArray(document.getElementById("project-system-flow-field").value),
    takeawayTitle: document.getElementById("project-takeaway-title-field").value.trim(),
    takeawayBody: document.getElementById("project-takeaway-body-field").value.trim(),
    codeTitle: document.getElementById("project-code-title-field").value.trim(),
    codeExample: document.getElementById("project-code-example-field").value
  };
}

function readSiteForm() {
  const next = structuredClone(state.site || {});
  next.hero = next.hero || {};
  next.hero.name = next.hero.name || {};
  next.about = next.about || {};
  next.contact = next.contact || {};

  next.hero.eyebrow = document.getElementById("site-hero-eyebrow").value.trim();
  next.hero.name.first = document.getElementById("site-first-name").value.trim();
  next.hero.name.last = document.getElementById("site-last-name").value.trim();
  next.hero.description = document.getElementById("site-hero-description").value.trim();
  next.about.heading = document.getElementById("site-about-heading").value.trim();
  next.about.profileName = document.getElementById("site-profile-name").value.trim();
  next.about.profileDescription = document.getElementById("site-profile-description").value.trim();
  next.contact.heading = document.getElementById("site-contact-heading").value.trim();
  next.contact.description = document.getElementById("site-contact-description").value.trim();

  return next;
}

async function loadDashboard() {
  const payload = await api("/api/admin/bootstrap", { method: "GET" });
  state.site = payload.site || {};
  state.projects = payload.projects || [];
  fillSiteForm();
  renderProjectList();
  selectProject(state.projects[0]?.slug || null);
  setStatus("Connected to portfolio admin.");
}

async function saveSite() {
  const site = readSiteForm();
  await api("/api/site", {
    method: "PUT",
    body: JSON.stringify({ site })
  });
  state.site = site;
  setStatus("Site content saved.");
}

async function saveProject() {
  const project = readProjectForm();
  const existing = currentProject();
  const method = existing ? "PUT" : "POST";
  const path = existing ? `/api/projects/${encodeURIComponent(existing.slug)}` : "/api/projects";
  const payload = await api(path, {
    method,
    body: JSON.stringify(project)
  });

  const saved = payload.project;
  const index = state.projects.findIndex((item) => item.slug === existing?.slug);
  if (index >= 0) {
    state.projects[index] = saved;
  } else {
    state.projects.push(saved);
  }

  state.projects.sort((a, b) => a.sortOrder - b.sortOrder);
  state.selectedSlug = saved.slug;
  renderProjectList();
  fillProjectForm(saved);
  setStatus(`Saved project "${saved.title}".`);
}

async function deleteProject() {
  const project = currentProject();
  if (!project) {
    setStatus("Select a project to delete.", true);
    return;
  }

  await api(`/api/projects/${encodeURIComponent(project.slug)}`, {
    method: "DELETE"
  });

  state.projects = state.projects.filter((item) => item.slug !== project.slug);
  state.selectedSlug = null;
  renderProjectList();
  fillProjectForm(null);
  setStatus(`Deleted project "${project.title}".`);
}

async function uploadCoverImage() {
  const slug = document.getElementById("project-slug").value.trim();
  const fileInput = document.getElementById("project-cover-upload");
  const file = fileInput.files?.[0];

  if (!slug || !file) {
    setStatus("Set a slug and choose an image before uploading.", true);
    return;
  }

  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : ".jpg";
  const key = `projects/${slug}/cover${extension.toLowerCase()}`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("key", key);

  const response = await fetch("/api/media/upload", {
    method: "POST",
    headers: {
      "x-admin-token": state.token
    },
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Upload failed with ${response.status}`);
  }

  const payload = await response.json();
  document.getElementById("project-cover-image-key").value = payload.key;
  setStatus(`Uploaded cover image to ${payload.key}.`);
}

function bindEvents() {
  document.getElementById("admin-token").value = state.token;

  document.getElementById("admin-connect").addEventListener("click", async () => {
    state.token = document.getElementById("admin-token").value.trim();
    sessionStorage.setItem("portfolio-admin-token", state.token);

    try {
      await loadDashboard();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("save-site").addEventListener("click", async () => {
    try {
      await saveSite();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("new-project").addEventListener("click", () => {
    state.selectedSlug = null;
    renderProjectList();
    fillProjectForm(null);
  });

  document.getElementById("save-project").addEventListener("click", async () => {
    try {
      await saveProject();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("delete-project").addEventListener("click", async () => {
    try {
      await deleteProject();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("upload-cover").addEventListener("click", async () => {
    try {
      await uploadCoverImage();
    } catch (error) {
      setStatus(error.message, true);
    }
  });
}

bindEvents();

if (state.token) {
  loadDashboard().catch((error) => {
    setStatus(error.message, true);
  });
}
