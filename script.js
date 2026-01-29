// ===== Config =====
const SLIDE_KEYS = ["poza1", "terasa", "view", "viewcabane", "pozaciubar", "pensiune"];
const EXTS = ["jpg", "jpeg", "png", "webp"];

// ===== Helpers =====
function resolveImageUrl(key){
  return new Promise((resolve) => {
    let i = 0;

    function tryNext(){
      if (i >= EXTS.length){
        resolve(null);
        return;
      }

      const url = `./poze/${key}.${EXTS[i]}`;
      i += 1;

      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => tryNext();
      img.src = url;
    }

    tryNext();
  });
}

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

function setupYear(){
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

function setupNav(){
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  if (!nav || !navToggle) return;

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    const inside = nav.contains(e.target) || navToggle.contains(e.target);
    if (!inside && nav.classList.contains("is-open")){
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ===== Hero Slider (runs only if hero exists) =====
function createHeroSlider(){
  const heroBgA = document.getElementById("heroBgA");
  const heroBgB = document.getElementById("heroBgB");
  const heroDots = document.getElementById("heroDots");
  const hero = document.querySelector(".hero");

  if (!heroBgA || !heroBgB || !heroDots || !hero) return null;

  let index = 0;
  let showingA = true;
  let timerId = null;

  function setBg(el, url){
    if (!url) return;
    el.style.backgroundImage = `url("${url}")`;
  }

  function renderDots(){
    heroDots.innerHTML = "";
    SLIDE_KEYS.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "dot" + (i === index ? " is-active" : "");
      b.setAttribute("aria-label", `Slide ${i + 1}`);
      b.addEventListener("click", () => goTo(i, true));
      heroDots.appendChild(b);
    });
  }

  async function showSlide(i){
    const url = await resolveImageUrl(SLIDE_KEYS[i]);
    const on = showingA ? heroBgB : heroBgA;
    const off = showingA ? heroBgA : heroBgB;

    setBg(on, url);
    on.classList.add("is-visible");
    off.classList.remove("is-visible");

    showingA = !showingA;
    renderDots();
  }

  function next(){
    index = (index + 1) % SLIDE_KEYS.length;
    showSlide(index);
  }

  function goTo(i, restart){
    index = i;
    showSlide(index);
    if (restart){
      stop();
      start();
    }
  }

  function start(){
    timerId = setInterval(next, 6500);
  }

  function stop(){
    if (timerId){
      clearInterval(timerId);
      timerId = null;
    }
  }

  function setupSwipe(){
    let startX = 0;
    let endX = 0;

    hero.addEventListener("touchstart", (e) => {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });

    hero.addEventListener("touchend", (e) => {
      endX = e.changedTouches[0].screenX;
      const diff = endX - startX;
      if (Math.abs(diff) < 50) return;

      stop();
      if (diff < 0){
        next();
      } else {
        index = (index - 1 + SLIDE_KEYS.length) % SLIDE_KEYS.length;
        showSlide(index);
      }
      start();
    });
  }

  async function init(){
    const firstUrl = await resolveImageUrl(SLIDE_KEYS[0]);
    const secondUrl = await resolveImageUrl(SLIDE_KEYS[1] || SLIDE_KEYS[0]);

    setBg(heroBgA, firstUrl);
    heroBgA.classList.add("is-visible");
    setBg(heroBgB, secondUrl);

    renderDots();
    setupSwipe();
    start();
  }

  return { init };
}

// ===== Init =====
(async function init(){
  setupYear();
  setupNav();
  await hydrateLocalImages();

  const slider = createHeroSlider();
  if (slider) await slider.init();
})();
