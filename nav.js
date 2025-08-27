// nav.js — inject sidebar ให้เหมือนกันทุกหน้า
window.renderSidebar = function (activeKey) {
  const html = `
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">N</div>
        <h2>Nail</h2>
        <p class="role">Game Developer</p>
      </div>
      <nav>
        <ul>
          <li><a data-key="home"      href="index.html">Home</a></li>
          <li><a data-key="resume"    href="resume.html">Resume</a></li>
          <li><a data-key="portfolio" href="portfolio.html">Portfolio</a></li>
          <li><a data-key="contact"   href="contact.html">Contact</a></li>
        </ul>
      </nav>
      <footer>
        <p>© 2025 - Nail Portfolio</p>
      </footer>
    </aside>
  `;
  const host = document.getElementById("sidebar");
  if (!host) return;
  host.outerHTML = html; // แทนที่ตัวเองด้วย sidebar

  // set active item + glow
  const links = document.querySelectorAll(".sidebar nav a");
  links.forEach((a) => {
    if (a.dataset.key === activeKey) a.classList.add("active");
  });
};
