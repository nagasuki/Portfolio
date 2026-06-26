const state = {
  token: sessionStorage.getItem("portfolio-admin-token") || "",
  site: null,
  projects: [],
  selectedSlug: null,
  draggingSlug: null,
  isReordering: false
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

function sortedProjects(projects = state.projects) {
  return [...projects].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 0;
    const orderB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0;
    return orderA - orderB;
  });
}

function normalizeProjectOrder(projects) {
  return projects.map((project, index) => ({
    ...project,
    sortOrder: index + 1
  }));
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
      const message = [payload.error, payload.detail].filter(Boolean).join(": ");
      throw new Error(message || `Request failed with ${response.status}`);
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
    .map((project, index) => `
      <article
        class="admin-project-item${project.slug === state.selectedSlug ? " is-active" : ""}${project.slug === state.draggingSlug ? " is-dragging" : ""}"
        data-slug="${escapeHtml(project.slug)}"
        draggable="true"
      >
        <button class="admin-project-main" type="button" data-select-slug="${escapeHtml(project.slug)}">
          <strong>${escapeHtml(project.title)}</strong>
          <span>${escapeHtml(project.slug)} / #${index + 1}</span>
        </button>
        <div class="admin-project-actions" aria-label="Reorder ${escapeHtml(project.title)}">
          <button
            class="admin-project-move"
            type="button"
            data-move-slug="${escapeHtml(project.slug)}"
            data-direction="-1"
            ${index === 0 || state.isReordering ? "disabled" : ""}
          >Up</button>
          <button
            class="admin-project-move"
            type="button"
            data-move-slug="${escapeHtml(project.slug)}"
            data-direction="1"
            ${index === state.projects.length - 1 || state.isReordering ? "disabled" : ""}
          >Down</button>
        </div>
      </article>
    `)
    .join("");

  list.querySelectorAll("[data-select-slug]").forEach((button) => {
    button.addEventListener("click", () => {
      selectProject(button.dataset.selectSlug);
    });
  });

  list.querySelectorAll("[data-move-slug]").forEach((button) => {
    button.addEventListener("click", async () => {
      await moveProject(button.dataset.moveSlug, Number(button.dataset.direction));
    });
  });

  list.querySelectorAll("[draggable='true']").forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      state.draggingSlug = item.dataset.slug;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.dataset.slug);
      item.classList.add("is-dragging");
    });

    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      item.classList.add("is-drop-target");
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("is-drop-target");
    });

    item.addEventListener("drop", async (event) => {
      event.preventDefault();
      item.classList.remove("is-drop-target");

      const sourceSlug = event.dataTransfer.getData("text/plain") || state.draggingSlug;
      const targetSlug = item.dataset.slug;
      const rect = item.getBoundingClientRect();
      const placement = event.clientY > rect.top + rect.height / 2 ? "after" : "before";

      await moveProjectTo(sourceSlug, targetSlug, placement);
    });

    item.addEventListener("dragend", () => {
      state.draggingSlug = null;
      renderProjectList();
    });
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[character]);
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
    mediaType: "image",
    mediaSrc: "",
    placeholder: "",
    coverImageKey: "",
    tags: [],
    stack: [],
    responsibilities: [],
    systemFlow: [],
    takeawayTitle: "",
    takeawayBody: ""
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
}

function selectProject(slug) {
  state.selectedSlug = slug;
  renderProjectList();
  fillProjectForm(currentProject());
}

function syncSelectedSortOrder() {
  const project = currentProject();
  const input = document.getElementById("project-sort-order");
  if (project && input) {
    input.value = project.sortOrder ?? 0;
  }
}

async function saveProjectOrder(nextProjects) {
  if (state.isReordering) {
    return;
  }

  const previousProjects = state.projects;
  const orderedProjects = normalizeProjectOrder(nextProjects);

  state.isReordering = true;
  state.projects = orderedProjects;
  renderProjectList();
  syncSelectedSortOrder();
  setStatus("Saving project order...");

  try {
    const payload = await api("/api/admin/projects/reorder", {
      method: "PUT",
      body: JSON.stringify({
        slugs: orderedProjects.map((project) => project.slug)
      })
    });

    state.projects = sortedProjects(payload.projects || orderedProjects);
    setStatus("Project order saved.");
  } catch (error) {
    state.projects = previousProjects;
    setStatus(error.message, true);
  } finally {
    state.isReordering = false;
    state.draggingSlug = null;
    renderProjectList();
    syncSelectedSortOrder();
  }
}

async function moveProject(slug, direction) {
  const currentIndex = state.projects.findIndex((project) => project.slug === slug);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.projects.length) {
    return;
  }

  const nextProjects = [...state.projects];
  [nextProjects[currentIndex], nextProjects[nextIndex]] = [
    nextProjects[nextIndex],
    nextProjects[currentIndex]
  ];

  await saveProjectOrder(nextProjects);
}

async function moveProjectTo(sourceSlug, targetSlug, placement) {
  if (!sourceSlug || !targetSlug || sourceSlug === targetSlug) {
    return;
  }

  const nextProjects = [...state.projects];
  const sourceIndex = nextProjects.findIndex((project) => project.slug === sourceSlug);
  const targetIndex = nextProjects.findIndex((project) => project.slug === targetSlug);

  if (sourceIndex < 0 || targetIndex < 0) {
    return;
  }

  const [project] = nextProjects.splice(sourceIndex, 1);
  const adjustedTargetIndex = nextProjects.findIndex((item) => item.slug === targetSlug);
  const insertIndex = placement === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
  nextProjects.splice(insertIndex, 0, project);

  await saveProjectOrder(nextProjects);
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
    takeawayBody: document.getElementById("project-takeaway-body-field").value.trim()
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
  state.projects = sortedProjects(payload.projects || []);
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

  state.projects = sortedProjects(state.projects);
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

function mediaKeyForFile(slug, file) {
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : file.type.startsWith("video/")
      ? ".mp4"
      : ".jpg";
  const mediaName = file.type.startsWith("video/") ? "video" : "cover";
  return `projects/${slug}/${mediaName}${extension.toLowerCase()}`;
}

async function uploadProjectMedia() {
  const slug = document.getElementById("project-slug").value.trim();
  const fileInput = document.getElementById("project-cover-upload");
  const file = fileInput.files?.[0];

  if (!slug || !file) {
    setStatus("Set a slug and choose an image or video before uploading.", true);
    return;
  }

  const key = mediaKeyForFile(slug, file);
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
  if (file.type.startsWith("video/")) {
    document.getElementById("project-media-type").value = "video";
    document.getElementById("project-media-src").value = payload.key;
  } else {
    document.getElementById("project-media-type").value = "image";
    document.getElementById("project-cover-image-key").value = payload.key;
  }

  fileInput.value = "";
  setStatus(`Uploaded project media to ${payload.key}. Save Project to publish it.`);
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
      await uploadProjectMedia();
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
