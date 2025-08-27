const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

let allProjects = [];
document.addEventListener("DOMContentLoaded", async () => {
  $("#year").textContent = new Date().getFullYear();
  initTheme();
  await loadProjects();
  initFilters();
  initMobileNav();
  initContactForm();
});

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") {
    document.documentElement.setAttribute("data-theme", saved);
  }
  $("#themeToggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}

async function loadProjects() {
  try {
    const url = new URL("projects.json", window.location.href);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok)
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${res.url}`);
    const raw = await res.text();
    const noBom = raw.replace(/^\uFEFF/, "");
    allProjects = JSON.parse(noBom);

    renderProjects(allProjects);
  } catch (err) {
    console.error("Projeler yüklenemedi:", err);
    const el = document.getElementById("loadError");
    el.hidden = false;
    el.textContent = `Projeler yüklenemedi: ${err.message}`;
  }
}

function renderProjects(list) {
  const grid = $("#projects");
  grid.innerHTML = "";

  if (!list || list.length === 0) {
    $("#emptyState").hidden = false;
    return;
  }
  $("#emptyState").hidden = true;

  const frag = document.createDocumentFragment();

  list.forEach((p) => {
    const card = document.createElement("article");
    card.className = "project card";
    card.innerHTML = `
      <div class="project__thumb">
        <img src="${p.image}" alt="${escapeHtml(
      p.title
    )} ekran görüntüsü" loading="lazy" />
      </div>
      <div>
        <h3 class="project__title">${escapeHtml(p.title)}</h3>
        <p class="project__summary">${escapeHtml(p.summary)}</p>
        <div class="chips">
          ${p.tech
            .map((t) => `<span class="chip">${escapeHtml(t)}</span>`)
            .join("")}
        </div>
      </div>
      <div class="links">
        ${
          p.githubUrl
            ? `<a class="btn btn-outline" href="${p.githubUrl}" target="_blank" rel="noopener">GitHub</a>`
            : ""
        }
        ${
          p.liveUrl
            ? `<a class="btn" href="${p.liveUrl}" target="_blank" rel="noopener">Live</a>`
            : ""
        }
      </div>
    `;
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

function initFilters() {
  const search = $("#searchInput");
  const featuredOnly = $("#featuredOnly");

  let lastQuery = "";
  let lastFeatured = false;
  let timer;

  const apply = () => {
    const q = lastQuery.trim().toLowerCase();
    const filtered = allProjects.filter((p) => {
      const hay = [p.title, p.summary, ...(p.tech || [])]
        .join(" ")
        .toLowerCase();
      const matchText = q === "" || hay.includes(q);
      const matchFeat = !lastFeatured || !!p.featured;
      return matchText && matchFeat;
    });
    renderProjects(filtered);
  };

  search.addEventListener("input", () => {
    lastQuery = search.value;
    clearTimeout(timer);
    timer = setTimeout(apply, 120);
  });

  featuredOnly.addEventListener("change", () => {
    lastFeatured = featuredOnly.checked;
    apply();
  });
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const btn = document.getElementById("sendBtn");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Gönderiliyor...";
    btn.disabled = true;

    try {
      const endpoint = form.getAttribute("action");
      const fd = new FormData(form);

      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        status.style.color = "var(--success)";
        status.textContent =
          "Teşekkürler! Mesajın ulaştı. En kısa sürede dönüş yapacağım.";
        form.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Hata: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      status.style.color = "var(--error)";
      status.textContent =
        "Gönderilemedi. Lütfen e-postanı doğru yazdığından emin ol veya daha sonra tekrar dene.";
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });
}
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("primary-nav");
  if (!toggle || !nav) return;

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.dataset.collapsed = "true";
    document.body.classList.remove("nav-open");
  };
  const open = () => {
    toggle.setAttribute("aria-expanded", "true");
    nav.dataset.collapsed = "false";
    document.body.classList.add("nav-open");
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    expanded ? close() : open();
  });

  nav.querySelectorAll("a,button").forEach((el) => {
    el.addEventListener("click", close);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}
