(function() {
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = String(new Date().getFullYear());

  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  if(navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open");
    });
  }

  const exts = ["jpg", "jpeg", "png", "webp"];
  const cache = new Map();

  function setBg(el, url) {
    if(!el) return;
    if(!url) {
      el.style.backgroundImage = "none";
      el.classList.add("is-missing");
      return;
    }
    el.classList.remove("is-missing");
    el.style.backgroundImage = `url("${url}")`;
  }

  function imgExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function resolveImageUrl(key) {
    if(!key) return null;
    if(cache.has(key)) return cache.get(key);

    const candidates = [key];

    // auto-fix: if ends with no digit, try adding "1"
    if(!/\d$/.test(key)) candidates.push(`${key}1`);

    // also try key with spaces trimmed
    const trimmed = String(key).trim();
    if(trimmed !== key) candidates.push(trimmed);

    for(const cand of candidates) {
      for(const ext of exts) {
        const url = `./poze/${cand}.${ext}`;
        const ok = await imgExists(url);
        if(ok) {
          cache.set(key, url);
          return url;
        }
      }
    }

    cache.set(key, null);
    return null;
  }

  // apply backgrounds for all [data-img]
  async function hydrateDataImages() {
    const els = Array.from(document.querySelectorAll("[data-img]"));
    for(const el of els) {
      const key = el.getAttribute("data-img");
      const url = await resolveImageUrl(key);
      setBg(el, url);
    }
  }

  hydrateDataImages();

  // ===== ROOM MODAL (Booking-style) =====
  const modal = document.getElementById("roomModal");
  if(!modal) return;

  const modalImage = document.getElementById("modalImage");
  const modalThumbs = document.getElementById("modalThumbs");
  const modalTitle = document.getElementById("modalTitle");
  const modalSub = document.getElementById("modalSub");
  const modalBadges = document.getElementById("modalBadges");
  const modalDesc = document.getElementById("modalDesc");
  const modalStock = document.getElementById("modalStock");

  const btnPrev = modal.querySelector(".modal__nav--prev");
  const btnNext = modal.querySelector(".modal__nav--next");

  let images = [];
  let activeIndex = 0;

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    images = [];
    activeIndex = 0;
    if(modalThumbs) modalThumbs.innerHTML = "";
    setBg(modalImage, null);
  }

  function badgesFrom(str) {
    const items = (str || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if(!modalBadges) return;
    modalBadges.innerHTML = "";

    for(const it of items) {
      const d = document.createElement("div");
      d.className = "modal__badge";
      d.textContent = it;
      modalBadges.appendChild(d);
    }
  }

  async function renderActive() {
    if(!images.length) return;

    const key = images[activeIndex];
    const url = await resolveImageUrl(key);
    setBg(modalImage, url);

    const thumbs = Array.from(modalThumbs.querySelectorAll(".modal__thumb"));
    thumbs.forEach((t, i) => t.classList.toggle("is-active", i === activeIndex));
  }

  async function buildThumbs() {
    if(!modalThumbs) return;
    modalThumbs.innerHTML = "";

    for(let i = 0; i < images.length; i += 1) {
      const key = images[i];
      const url = await resolveImageUrl(key);

      const b = document.createElement("button");
      b.type = "button";
      b.className = "modal__thumb" + (i === activeIndex ? " is-active" : "");
      b.setAttribute("aria-label", `Imagine ${i + 1}`);
      setBg(b, url);

      b.addEventListener("click", () => {
        activeIndex = i;
        renderActive();
      });

      modalThumbs.appendChild(b);
    }
  }

  function next() {
    if(!images.length) return;
    activeIndex = (activeIndex + 1) % images.length;
    renderActive();
  }

  function prev() {
    if(!images.length) return;
    activeIndex = (activeIndex - 1 + images.length) % images.length;
    renderActive();
  }

  if(btnNext) btnNext.addEventListener("click", next);
  if(btnPrev) btnPrev.addEventListener("click", prev);

  // open buttons
  const openers = Array.from(document.querySelectorAll("[data-open-room]"));
  for(const btn of openers) {
    btn.addEventListener("click", async () => {
      const title = btn.getAttribute("data-room-title") || "";
      const price = btn.getAttribute("data-room-price") || "";
      const stock = btn.getAttribute("data-room-stock") || "";
      const features = btn.getAttribute("data-room-features") || "";
      const desc = btn.getAttribute("data-room-desc") || "";
      const imgs = btn.getAttribute("data-images") || "";

      if(modalTitle) modalTitle.textContent = title;
      if(modalSub) modalSub.textContent = price;
      if(modalStock) modalStock.textContent = stock;
      if(modalDesc) modalDesc.textContent = desc;
      badgesFrom(features);

      images = imgs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      activeIndex = 0;

      openModal();
      await buildThumbs();
      await renderActive();
    });
  }

  // close handlers
  const closers = Array.from(modal.querySelectorAll("[data-modal-close]"));
  for(const c of closers) {
    c.addEventListener("click", closeModal);
  }

  document.addEventListener("keydown", (e) => {
    if(!modal.classList.contains("is-open")) return;

    if(e.key === "Escape") {
      closeModal();
    } else if(e.key === "ArrowRight") {
      next();
    } else if(e.key === "ArrowLeft") {
      prev();
    }
  });
})();

(function() {
  const heroA = document.getElementById("heroBgA");
  const heroB = document.getElementById("heroBgB");
  const dotsWrap = document.getElementById("heroDots");

  if(!heroA || !heroB) return;

  const slides = ["Coperta1", "Coperta2", "Coperta3", "Coperta4", "Coperta5"];
  const exts = ["jpg", "jpeg", "png", "webp"];
  const cache = new Map();

  function setBg(el, url) {
    if(!el || !url) return;
    el.style.backgroundImage = `url("${url}")`;
  }

  function imgExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function resolveImageUrl(key) {
    if(!key) return null;
    if(cache.has(key)) return cache.get(key);

    for(const ext of exts) {
      const url = `./poze/${key}.${ext}`;
      const ok = await imgExists(url);
      if(ok) {
        cache.set(key, url);
        return url;
      }
    }

    cache.set(key, null);
    return null;
  }

  // ===== dots =====
  function buildDots() {
    if(!dotsWrap) return;
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hero__dot" + (i === 0 ? " is-active" : "");
      b.setAttribute("aria-label", `Slide ${i + 1}`);
      b.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(b);
    });
  }

  function setActiveDot(i) {
    if(!dotsWrap) return;
    const dots = Array.from(dotsWrap.querySelectorAll(".hero__dot"));
    dots.forEach((d, idx) => d.classList.toggle("is-active", idx === i));
  }

  // ===== slider logic (A/B crossfade) =====
  let index = 0;
  let showingA = true;
  let timer = null;
  let isPaused = false;

  async function applyInitial() {
    const url0 = await resolveImageUrl(slides[0]);
    const url1 = await resolveImageUrl(slides[1]);

    if(url0) setBg(heroA, url0);
    if(url1) setBg(heroB, url1);

    heroA.classList.add("is-show");
    heroB.classList.remove("is-show");
  }

  async function goTo(i, userTriggered = false) {
    index = (i + slides.length) % slides.length;

    const nextIndex = index;
    const nextKey = slides[nextIndex];
    const nextUrl = await resolveImageUrl(nextKey);

    const incoming = showingA ? heroB : heroA;
    const outgoing = showingA ? heroA : heroB;

    if(nextUrl) setBg(incoming, nextUrl);

    incoming.classList.add("is-show");
    outgoing.classList.remove("is-show");

    showingA = !showingA;
    setActiveDot(nextIndex);

    if(userTriggered) restart();
  }

  function next() {
    if(isPaused) return;
    goTo(index + 1);
  }

  function restart() {
    stop();
    start();
  }

  function start() {
    timer = setInterval(next, 4500); // schimbă la 3500/5000 cum vrei
  }

  function stop() {
    if(timer) clearInterval(timer);
    timer = null;
  }

  // pause on hover (opțional)
  const hero = heroA.closest(".hero");
  if(hero) {
    hero.addEventListener("mouseenter", () => { isPaused = true; });
    hero.addEventListener("mouseleave", () => { isPaused = false; });
  }

  // init
  buildDots();
  applyInitial().then(() => start());
})();

