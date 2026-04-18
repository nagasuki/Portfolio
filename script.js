const showcaseItems = [
  {
    title: "Buddy Beater",
    kicker: "Multiplayer Battle Royale",
    description:
      "A gameplay showcase centered on multiplayer action, readable combat flow, and live-service-ready technical foundations.",
    tags: ["Unity", "Networking", "AWS GameLift"],
    href: "projects/buddy-beater.html",
    mediaType: "placeholder",
    mediaSrc: "",
    placeholder: "Gameplay Clip Ready",
  },
  {
    title: "BeforeYourDrive",
    kicker: "VR Driving Simulation",
    description:
      "A VR project focused on practical interaction, smooth driving control, and hardware compatibility across multiple headset setups.",
    tags: ["VR", "Simulation", "Unity"],
    href: "projects/before-your-drive.html",
    mediaType: "placeholder",
    mediaSrc: "",
    placeholder: "Add Trailer / Gameplay",
  },
  {
    title: "Systems Showcase",
    kicker: "Controller, Inventory, Multiplayer",
    description:
      "A dedicated slot for your current gameplay work such as KCC controller feel, inventory architecture, item systems, and Photon Quantum features.",
    tags: ["KCC", "Photon Quantum", "Architecture"],
    href: "projects/systems-showcase.html",
    mediaType: "placeholder",
    mediaSrc: "",
    placeholder: "Drop in Latest Demo",
  },
];

const showcaseGrid = document.querySelector("#showcase-grid");

if (showcaseGrid) {
  showcaseGrid.innerHTML = showcaseItems
    .map((item) => {
      const media =
        item.mediaType === "video" && item.mediaSrc
          ? `
            <video controls muted playsinline preload="metadata">
              <source src="${item.mediaSrc}">
            </video>
          `
          : item.mediaType === "embed" && item.mediaSrc
            ? `
              <iframe
                src="${item.mediaSrc}"
                title="${item.title}"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            `
            : `
              <div class="showcase-placeholder">
                <div class="placeholder-content">
                  <span class="placeholder-label">${item.placeholder}</span>
                  <h3 class="placeholder-title">${item.title}</h3>
                  <p class="placeholder-caption">${item.kicker}</p>
                </div>
              </div>
            `;

      const tags = item.tags.map((tag) => `<li>${tag}</li>`).join("");

      return `
        <article class="showcase-card">
          <div class="showcase-media">
            ${media}
          </div>
          <div class="showcase-info">
            <p class="showcase-kicker">${item.kicker}</p>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <ul class="showcase-tags">${tags}</ul>
            <div class="showcase-actions">
              <a class="button button-primary" href="${item.href}">Open Case Study</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

const revealItems = document.querySelectorAll(".reveal");

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
    rootMargin: "0px 0px -40px 0px",
  }
);

revealItems.forEach((item) => observer.observe(item));
