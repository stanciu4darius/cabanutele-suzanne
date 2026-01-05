const year = document.getElementById("year");
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");

const heroBgA = document.getElementById("heroBgA");
const heroBgB = document.getElementById("heroBgB");
const heroDots = document.getElementById("heroDots");

// Cheile sunt NUMELE fișierelor fără extensie (exact ca în folderul tău).
const slideKeys = [
  "poza1",
  "terasa",
  "view",
  "viewcabane",
  "pozaciubar",
  "pensiune"
];

// extensii posibile (scriptul încearcă în ordine)
const exts = ["jpg", "jpeg", "png", "webp"];

let index = 0;
let showingA = true;
let timerId = null;

function pathFor(key, ext){
  return `./poze/${key}.${ext}`;
}

function resolveImageUrl(key){
  return new Promise((resolve) => {
    let i = 0;

    function tryNext(){
      if (i >= exts.length){
        resolve(null);
        return;
      }

      const url = pathFor(key, exts[i]);
      i += 1;

      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => tryNext();
      img.src = url;
    }

    tryNext();
  });
}

function setBg(el, url){
  if (!url) return;
  el.style.backgroundImage = `url("${url}")`;
}

function renderDots(){
  heroDots.innerHTML = "";

  slideKeys.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "dot" + (i === index ? " is-active" : "");
    b.setAttribute("aria-label", `Slide ${i + 1}`);
    b.addEventListener("click", () => goTo(i, true));
    heroDots.appendChild(b);
  });
}

async function showSlide(i){
  const key = slideKeys[i];
  const url = await resolveImageUrl(key);

  const on = showingA ? heroBgB : heroBgA;
  const off = showingA ? heroBgA : heroBgB;

  setBg(on, url);
  on.classList.add("is-visible");
  off.classList.remove("is-visible");

  showingA = !showingA;
  renderDots();
}

function next(){
  index = (index + 1) % slideKeys.length;
  showSlide(index);
}

function goTo(i, restart){
  index = i;
  showSlide(index);

  if (restart){
    stopAuto();
    startAuto();
  }
}

function startAuto(){
  timerId = setInterval(next, 6500);
}

function stopAuto(){
  if (timerId){
    clearInterval(timerId);
    timerId = null;
  }
}

function setupNav(){
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    const isClickInside = nav.contains(e.target) || navToggle.contains(e.target);
    if (!isClickInside && nav.classList.contains("is-open")){
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupActiveLinks(){
  const links = Array.from(document.querySelectorAll(".nav__link"));
  const sections = links
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting){
        links.forEach((l) => l.classList.remove("is-active"));
        const active = links.find((l) => l.getAttribute("href") === `#${entry.target.id}`) || links[0];
        active.classList.add("is-active");
      }
    });
  }, { rootMargin: "-60% 0px -35% 0px", threshold: 0.01 });

  sections.forEach((s) => io.observe(s));
}

function setupSwipe(){
  let startX = 0;
  let endX = 0;

  const hero = document.querySelector(".hero");
  hero.addEventListener("touchstart", (e) => {
    startX = e.changedTouches[0].screenX;
  }, { passive: true });

  hero.addEventListener("touchend", (e) => {
    endX = e.changedTouches[0].screenX;
    const diff = endX - startX;

    if (Math.abs(diff) < 50) return;

    stopAuto();
    if (diff < 0){
      next();
    } else {
      index = (index - 1 + slideKeys.length) % slideKeys.length;
      showSlide(index);
    }
    startAuto();
  });
}

// pune automat imaginile pe elementele cu data-img="nume"
async function hydrateLocalImages(){
  const nodes = Array.from(document.querySelectorAll("[data-img]"));

  for (const el of nodes){
    const key = el.getAttribute("data-img");
    const url = await resolveImageUrl(key);
    if (url){
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    }
  }
}

async function init(){
  year.textContent = new Date().getFullYear();

  setupNav();
  setupActiveLinks();
  setupSwipe();

  await hydrateLocalImages();

  // prima imagine în hero
  const firstUrl = await resolveImageUrl(slideKeys[0]);
  const secondUrl = await resolveImageUrl(slideKeys[1] || slideKeys[0]);

  setBg(heroBgA, firstUrl);
  heroBgA.classList.add("is-visible");

  setBg(heroBgB, secondUrl);

  renderDots();
  startAuto();
}

init();
