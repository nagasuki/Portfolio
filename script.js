const fallbackDataUrl = "./data/site.json";

async function fetchPortfolio() {
  try {
    const response = await fetch("/api/portfolio");
    if (!response.ok) {
      throw new Error(`API request failed with ${response.status}`);
    }

    return await response.json();
  } catch {
    const response = await fetch(fallbackDataUrl);
    if (!response.ok) {
      throw new Error("Unable to load portfolio seed data");
    }

    return await response.json();
  }
}

function renderList(items, renderItem) {
  return items.map(renderItem).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element && value) {
    element.textContent = value;
  }
}

function setImage(id, src, alt) {
  const image = document.getElementById(id);
  if (!image || !src) {
    return;
  }

  image.src = src;
  if (alt) {
    image.alt = alt;
  }
}

function previewVideoSrc(src) {
  if (!src || src.includes("#")) {
    return src;
  }

  return `${src}#t=0.1`;
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
    // Analytics must never block portfolio rendering.
  }
}

function renderProjectOverlayPreview(item, media = "") {
  const caseStudyUrl = `project.html?slug=${encodeURIComponent(item.slug)}`;

  return `
    <a class="showcase-video-link" href="${caseStudyUrl}" aria-label="Open ${escapeHtml(item.title)} case study">
      ${media}
      <span class="showcase-video-panel" aria-hidden="true">
        <span class="placeholder-label">${escapeHtml(item.title)}</span>
        <span class="showcase-video-title">${escapeHtml(item.title)}</span>
        <span class="showcase-video-caption">${escapeHtml(item.kicker)}</span>
      </span>
    </a>
  `;
}

function renderProjectMediaPreview(item) {
  if (item.mediaType === "video" && item.mediaSrc) {
    const thumbnail = item.coverImage
      ? `
        <img
          src="${escapeHtml(item.coverImage)}"
          alt="${escapeHtml(item.title)}"
          class="showcase-video-thumbnail"
        >
      `
      : `
        <video class="showcase-video-thumbnail" muted playsinline preload="metadata">
          <source src="${escapeHtml(previewVideoSrc(item.mediaSrc))}">
        </video>
      `;

    return renderProjectOverlayPreview(item, thumbnail);
  }

  if (item.mediaType === "embed" && item.mediaSrc) {
    const thumbnail = item.coverImage
      ? `
        <img
          src="${escapeHtml(item.coverImage)}"
          alt="${escapeHtml(item.title)}"
          class="showcase-video-thumbnail"
        >
      `
      : "";

    return renderProjectOverlayPreview(item, thumbnail);
  }

  if (item.mediaType === "image" && (item.coverImage || item.mediaSrc)) {
    return `
      <img
        src="${escapeHtml(item.coverImage || item.mediaSrc)}"
        alt="${escapeHtml(item.title)}"
        class="showcase-cover-image"
      >
    `;
  }

  if (item.coverImage) {
    return `
      <img
        src="${escapeHtml(item.coverImage)}"
        alt="${escapeHtml(item.title)}"
        class="showcase-cover-image"
      >
    `;
  }

  return `
    <div class="showcase-placeholder">
      <div class="placeholder-content">
        <span class="placeholder-label">${escapeHtml(item.placeholder)}</span>
        <h3 class="placeholder-title">${escapeHtml(item.title)}</h3>
        <p class="placeholder-caption">${escapeHtml(item.kicker)}</p>
      </div>
    </div>
  `;
}

function renderSite(site) {
  const hero = site.hero || {};
  const about = site.about || {};
  const skills = site.skills || {};
  const contact = site.contact || {};

  setText("brand-link", site.brand);
  setText("hero-eyebrow", hero.eyebrow);
  setText("hero-first-name", hero.name?.first);
  setText("hero-last-name", hero.name?.last);
  setText("hero-description", hero.description);
  setText("hero-focus-label", hero.focusLabel);
  setText("hero-status-title", hero.status?.title);
  setText("hero-status-subtitle", hero.status?.subtitle);
  setText("about-heading", about.heading);
  setText("profile-eyebrow", about.profileEyebrow);
  setText("profile-name", about.profileName);
  setText("profile-description", about.profileDescription);
  setText("about-card-1", about.cards?.[0]);
  setText("about-card-2", about.cards?.[1]);
  setText("skills-heading", skills.heading);
  setText("contact-heading", contact.heading);
  setText("contact-description", contact.description);
  setImage(
    "profile-image",
    about.profileImage,
    `Portrait of ${about.profileName || "portfolio owner"}`
  );

  const metrics = document.getElementById("hero-metrics");
  if (metrics) {
    metrics.innerHTML = renderList(hero.metrics || [], (metric) => `
      <li>
        <strong>${escapeHtml(metric.value)}</strong>
        <span>${escapeHtml(metric.label)}</span>
      </li>
    `);
  }

  const focusList = document.getElementById("hero-focus-list");
  if (focusList) {
    focusList.innerHTML = renderList(
      hero.focusList || [],
      (item) => `<li>${escapeHtml(item)}</li>`
    );
  }

  const hardSkills = document.getElementById("hard-skills-tags");
  if (hardSkills) {
    hardSkills.innerHTML = renderList(
      skills.hard || [],
      (skill) => `<span>${escapeHtml(skill)}</span>`
    );
  }

  const softSkills = document.getElementById("soft-skills-tags");
  if (softSkills) {
    softSkills.innerHTML = renderList(
      skills.soft || [],
      (skill) => `<span>${escapeHtml(skill)}</span>`
    );
  }

  const contactLinks = document.getElementById("contact-links");
  if (contactLinks) {
    contactLinks.innerHTML = renderList(contact.links || [], (link) => `
      <a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">
        ${escapeHtml(link.label)}
      </a>
    `);
  }

  const moreProjects = document.getElementById("more-projects-grid");
  if (moreProjects) {
    moreProjects.innerHTML = renderList(site.moreProjects || [], (project) => `
      <article class="project-card reveal">
        <div class="project-index">${escapeHtml(project.index)}</div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <ul>
          ${renderList(project.tags || [], (tag) => `<li>${escapeHtml(tag)}</li>`)}
        </ul>
      </article>
    `);
  }
}

function renderFeaturedProjects(projects) {
  const showcaseGrid = document.querySelector("#showcase-grid");
  if (!showcaseGrid) {
    return;
  }

  const featuredProjects = projects
    .filter((item) => item.featured)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  showcaseGrid.innerHTML = featuredProjects
    .map((item) => {
      const media = renderProjectMediaPreview(item);
      const tags = renderList(item.tags || [], (tag) => `<li>${escapeHtml(tag)}</li>`);
      const demoAction = item.demoUrl
        ? `<a class="button button-secondary" href="${escapeHtml(item.demoUrl)}" target="_blank" rel="noreferrer">Try Project</a>`
        : "";

      return `
        <article class="showcase-card">
          <div class="showcase-media">
            ${media}
          </div>
          <div class="showcase-info">
            <p class="showcase-kicker">${escapeHtml(item.kicker)}</p>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary)}</p>
            <ul class="showcase-tags">${tags}</ul>
            <div class="showcase-actions">
              <a class="button button-primary" href="project.html?slug=${encodeURIComponent(item.slug)}">Open Case Study</a>
              ${demoAction}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function initializeRevealObserver() {
  const revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  revealItems.forEach((item) => observer.observe(item));

  window.setTimeout(() => {
    revealItems.forEach((item) => {
      if (!item.classList.contains("is-visible")) {
        item.classList.add("is-visible");
        observer.unobserve(item);
      }
    });
  }, 900);
}

async function bootstrap() {
  const data = await fetchPortfolio();
  renderSite(data.site || {});
  renderFeaturedProjects(data.projects || []);
  initializeRevealObserver();
  trackAnalyticsEvent({ type: "site_view" });
}

bootstrap().catch((error) => {
  console.error(error);
});
