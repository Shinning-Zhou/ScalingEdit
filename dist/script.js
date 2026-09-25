const siteConfig = {
  projectTitle: "ScalingEdit",
};

const fallbackTitle = "ScalingEdit";
const displayTitle = siteConfig.projectTitle.trim() || fallbackTitle;

document.querySelectorAll("[data-project-title]").forEach((element) => {
  element.textContent = displayTitle;
});

if (siteConfig.projectTitle.trim()) {
  document.title = `${siteConfig.projectTitle} · Project Page`;
}

const heroScroll = document.querySelector("#hero-scroll");
const hero = document.querySelector(".hero");
const heroTitleStage = document.querySelector(".hero-title-stage");
const heroMediaStage = document.querySelector(".hero-media-stage");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (hero) {
  if (prefersReducedMotion.matches) {
    hero.classList.add("is-center-visible");
  } else {
    window.setTimeout(() => hero.classList.add("is-center-visible"), 120);
  }
}

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const easeOutCubic = (value) => 1 - ((1 - value) ** 3);
const easeInOutCubic = (value) => value < .5
  ? 4 * value * value * value
  : 1 - ((-2 * value + 2) ** 3) / 2;
const lerp = (start, end, amount) => start + ((end - start) * amount);
const heroMosaicRatio = 2000 / 1011;
let heroFrame = 0;
let heroLetterLayout = [];
let heroLetters = [];

function sizeHeroMediaStage() {
  if (!hero || !heroMediaStage) return;

  const rect = hero.getBoundingClientRect();
  const heroRatio = rect.width / rect.height;
  const width = heroRatio > heroMosaicRatio ? rect.width : rect.height * heroMosaicRatio;
  const height = heroRatio > heroMosaicRatio ? rect.width / heroMosaicRatio : rect.height;
  heroMediaStage.style.width = `${width.toFixed(2)}px`;
  heroMediaStage.style.height = `${height.toFixed(2)}px`;
}

function buildHeroTitle() {
  if (!heroTitleStage) return;

  const characters = [...displayTitle];
  const secondCapital = characters.findIndex((character, index) => (
    index > 0 && /[A-Z]/.test(character)
  ));
  const splitIndex = secondCapital > 0 ? secondCapital : Math.ceil(characters.length * .64);
  const splitMeasure = document.createElement("span");
  splitMeasure.className = "hero-title-measure hero-title-measure--split";
  const joinedMeasure = document.createElement("span");
  joinedMeasure.className = "hero-title-measure hero-title-measure--joined";
  const letterLayer = document.createElement("span");
  letterLayer.className = "hero-title-letters";

  [characters.slice(0, splitIndex), characters.slice(splitIndex)].forEach((lineCharacters, lineIndex) => {
    const line = document.createElement("span");
    line.className = "hero-title-line";
    lineCharacters.forEach((character) => {
      const letter = document.createElement("span");
      letter.className = `hero-title-measure-letter hero-title-measure-letter--${lineIndex === 0 ? "scaling" : "edit"}`;
      letter.textContent = character;
      line.append(letter);
    });
    splitMeasure.append(line);
  });

  characters.forEach((character, index) => {
    const joinedLetter = document.createElement("span");
    joinedLetter.className = `hero-title-measure-letter hero-title-measure-letter--${index >= splitIndex ? "edit" : "scaling"}`;
    joinedLetter.textContent = character;
    joinedMeasure.append(joinedLetter);

    const animatedLetter = document.createElement("span");
    animatedLetter.className = `hero-title-letter hero-title-letter--${index >= splitIndex ? "edit" : "scaling"}`;
    if (index === 0 || index === splitIndex) animatedLetter.classList.add("hero-title-letter--initial");
    animatedLetter.textContent = character;
    letterLayer.append(animatedLetter);
  });

  heroTitleStage.replaceChildren(splitMeasure, joinedMeasure, letterLayer);
  heroLetters = [...letterLayer.children];
}

function measureHeroTitle() {
  if (!heroTitleStage || !heroLetters.length) return;

  const stageRect = heroTitleStage.getBoundingClientRect();
  const splitLetters = heroTitleStage.querySelectorAll(".hero-title-measure--split .hero-title-measure-letter");
  const joinedLetters = heroTitleStage.querySelectorAll(".hero-title-measure--joined .hero-title-measure-letter");
  const splitLines = heroTitleStage.querySelectorAll(".hero-title-measure--split .hero-title-line");
  const widestSplitLine = Math.max(...[...splitLines].map((line) => line.getBoundingClientRect().width));
  const joinedWidth = [...joinedLetters].reduce((sum, letter) => (
    sum + letter.getBoundingClientRect().width
  ), 0);
  const targetWidthRatio = stageRect.width < 560 ? .90 : .88;
  const joinedWidthRatio = stageRect.width < 560 ? .82 : .76;
  const initialScale = Math.min(1, (stageRect.width * targetWidthRatio) / widestSplitLine);
  const finalScale = Math.min(1, (stageRect.width * joinedWidthRatio) / joinedWidth);

  heroLetterLayout = heroLetters.map((letter, index) => {
    const startRect = splitLetters[index].getBoundingClientRect();
    const endRect = joinedLetters[index].getBoundingClientRect();
    const rawStart = {
      x: startRect.left + (startRect.width / 2) - stageRect.left - (stageRect.width / 2),
      y: startRect.top + (startRect.height / 2) - stageRect.top - (stageRect.height / 2),
    };
    const start = {
      x: rawStart.x * initialScale,
      y: rawStart.y * initialScale,
    };
    const end = {
      x: (endRect.left + (endRect.width / 2) - stageRect.left - (stageRect.width / 2)) * finalScale,
      y: (endRect.top + (endRect.height / 2) - stageRect.top - (stageRect.height / 2)) * finalScale,
    };

    return {
      start,
      end,
      initialScale,
      finalScale,
    };
  });

  heroTitleStage.classList.add("is-ready");
}

function paintHero(forcedProgress) {
  heroFrame = 0;
  if (!hero || !heroScroll || !heroLetterLayout.length) return;

  const travel = heroScroll.offsetHeight - hero.offsetHeight;
  const scrollProgress = travel > 0
    ? clamp01(-heroScroll.getBoundingClientRect().top / travel)
    : 1;
  const progress = typeof forcedProgress === "number" ? forcedProgress : scrollProgress;
  const mergeProgress = easeInOutCubic(clamp01(progress / .46));
  const detailProgress = easeOutCubic(clamp01((progress - .38) / .28));
  const titleProgress = easeOutCubic(clamp01(progress / .46));
  const gridZoomProgress = easeOutCubic(clamp01(progress / .82));
  const outerRevealProgress = easeInOutCubic(clamp01((progress - .025) / .3));
  const detailY = 28 * (1 - detailProgress);
  const scrimOpacity = .38 + (.34 * detailProgress);
  const brightness = .9 - (.3 * detailProgress);
  const gridScale = 1.22 - (.22 * gridZoomProgress);
  const outerMask = .96 - (.84 * outerRevealProgress);
  const cueOpacity = 1 - clamp01(progress / .08);

  heroLetters.forEach((letter, index) => {
    const layout = heroLetterLayout[index];
    const x = lerp(layout.start.x, layout.end.x, mergeProgress);
    const y = lerp(layout.start.y, layout.end.y - (42 * detailProgress), mergeProgress);
    const scale = lerp(layout.initialScale, layout.finalScale, mergeProgress);

    letter.style.setProperty("--letter-x", `${x.toFixed(2)}px`);
    letter.style.setProperty("--letter-y", `${y.toFixed(2)}px`);
    letter.style.setProperty("--letter-rotate", "0deg");
    letter.style.setProperty("--letter-scale", scale.toFixed(4));
  });

  hero.style.setProperty("--hero-detail-opacity", detailProgress.toFixed(3));
  hero.style.setProperty("--hero-detail-y", `${detailY.toFixed(2)}px`);
  hero.style.setProperty("--hero-scrim-opacity", scrimOpacity.toFixed(3));
  hero.style.setProperty("--hero-grid-brightness", brightness.toFixed(3));
  hero.style.setProperty("--hero-grid-scale", gridScale.toFixed(4));
  hero.style.setProperty("--hero-outer-mask", outerMask.toFixed(3));
  hero.style.setProperty("--hero-cue-opacity", cueOpacity.toFixed(3));
}

function queueHeroPaint() {
  if (heroFrame) return;
  heroFrame = window.requestAnimationFrame(() => paintHero());
}

if (hero && heroScroll && heroTitleStage) {
  sizeHeroMediaStage();
  buildHeroTitle();
  measureHeroTitle();
  paintHero(prefersReducedMotion.matches ? 1 : undefined);

  if (!prefersReducedMotion.matches) {
    window.addEventListener("scroll", queueHeroPaint, { passive: true });
  }

  window.addEventListener("resize", () => {
    sizeHeroMediaStage();
    measureHeroTitle();
    paintHero(prefersReducedMotion.matches ? 1 : undefined);
  }, { passive: true });
}

document.querySelectorAll("[data-demo-slots]").forEach((grid) => {
  const category = grid.dataset.demoSlots;
  const categoryLabel = grid.dataset.demoLabel;

  for (let index = 1; index <= 20; index += 1) {
    const number = String(index).padStart(2, "0");
    const slot = document.createElement("figure");
    slot.className = "demo-slot";

    const media = document.createElement("div");
    media.className = "demo-slot-media";
    media.tabIndex = 0;
    media.setAttribute("role", "slider");
    media.setAttribute("aria-label", `${categoryLabel} experiment ${number}: compare input and result`);
    media.setAttribute("aria-valuemin", "0");
    media.setAttribute("aria-valuemax", "100");
    media.setAttribute("aria-valuenow", "50");
    media.setAttribute("aria-valuetext", "Equal input and result comparison");

    const inputImage = document.createElement("img");
    inputImage.className = "demo-slot-input";
    inputImage.alt = `${categoryLabel} experiment ${number} editing instruction`;
    inputImage.loading = "lazy";
    inputImage.src = `assets/images/demos/${category}/${number}-input.png`;

    const resultImage = document.createElement("img");
    resultImage.className = "demo-slot-result";
    resultImage.alt = `${categoryLabel} experiment ${number} result`;
    resultImage.loading = "lazy";
    resultImage.src = `assets/images/demos/${category}/${number}-output.png`;

    const placeholder = document.createElement("span");
    placeholder.className = "demo-slot-placeholder";
    placeholder.innerHTML = `<strong>Reserved slot ${number}</strong><small>Input and result pending</small>`;

    const inputLabel = document.createElement("span");
    inputLabel.className = "demo-compare-label demo-compare-label--input";
    inputLabel.textContent = "Input";

    const resultLabel = document.createElement("span");
    resultLabel.className = "demo-compare-label demo-compare-label--result";
    resultLabel.textContent = "Result";

    const divider = document.createElement("span");
    divider.className = "demo-compare-line";
    divider.setAttribute("aria-hidden", "true");

    const handle = document.createElement("span");
    handle.className = "demo-compare-handle";
    handle.textContent = "↔";
    handle.setAttribute("aria-hidden", "true");

    const caption = document.createElement("figcaption");
    caption.innerHTML = `<span>${categoryLabel} ${number}</span><span class="demo-slot-hint">Drag handle to compare</span>`;

    let missingAsset = false;

    const markSlotMissing = () => {
      if (missingAsset) return;
      missingAsset = true;
      slot.classList.add("is-missing");
      media.tabIndex = -1;
      media.removeAttribute("role");
      media.removeAttribute("aria-valuemin");
      media.removeAttribute("aria-valuemax");
      media.removeAttribute("aria-valuenow");
      media.removeAttribute("aria-valuetext");
      media.setAttribute("aria-label", `${categoryLabel} experiment ${number}: reserved slot, images pending`);
      caption.querySelector(".demo-slot-hint").textContent = "Awaiting images";
    };

    inputImage.addEventListener("error", markSlotMissing, { once: true });
    resultImage.addEventListener("error", markSlotMissing, { once: true });

    const setComparison = (value) => {
      if (missingAsset) return;
      const position = Math.max(0, Math.min(100, value));
      media.style.setProperty("--compare-position", `${position}%`);
      media.setAttribute("aria-valuenow", String(Math.round(position)));
      media.setAttribute("aria-valuetext", `${Math.round(position)} percent input, ${Math.round(100 - position)} percent result`);
    };

    const setComparisonFromPointer = (event) => {
      const bounds = media.getBoundingClientRect();
      setComparison(((event.clientX - bounds.left) / bounds.width) * 100);
    };

    handle.addEventListener("pointerdown", (event) => {
      if (missingAsset) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      media.classList.add("is-interacting");
      media.focus({ preventScroll: true });
      setComparisonFromPointer(event);
    });

    handle.addEventListener("pointermove", (event) => {
      if (handle.hasPointerCapture(event.pointerId)) setComparisonFromPointer(event);
    });

    const finishPointerInteraction = (event) => {
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
      media.classList.remove("is-interacting");
    };

    handle.addEventListener("pointerup", finishPointerInteraction);
    handle.addEventListener("pointercancel", finishPointerInteraction);

    media.addEventListener("keydown", (event) => {
      const current = Number(media.getAttribute("aria-valuenow")) || 50;
      let next = current;

      if (event.key === "ArrowLeft") next = current - 5;
      else if (event.key === "ArrowRight") next = current + 5;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = 100;
      else return;

      event.preventDefault();
      setComparison(next);
    });

    media.append(placeholder, inputImage, resultImage, inputLabel, resultLabel, divider, handle);
    slot.append(media, caption);
    grid.append(slot);
  }
});

const demoTabs = [...document.querySelectorAll("[data-demo-tab]")];
const demoPanels = [...document.querySelectorAll("[data-demo-panel]")];

function activateDemoTab(tab, moveFocus = false) {
  if (!tab) return;

  const target = tab.dataset.demoTab;

  demoTabs.forEach((item) => {
    const isActive = item === tab;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    item.tabIndex = isActive ? 0 : -1;
  });

  demoPanels.forEach((panel) => {
    const isActive = panel.dataset.demoPanel === target;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  if (moveFocus) tab.focus();
}

demoTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateDemoTab(tab));

  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % demoTabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + demoTabs.length) % demoTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = demoTabs.length - 1;
    else return;

    event.preventDefault();
    activateDemoTab(demoTabs[nextIndex], true);
  });
});

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

function closeNavigation() {
  if (!navToggle || !navLinks) return;
  navToggle.setAttribute("aria-expanded", "false");
  navLinks.classList.remove("is-open");
  document.body.classList.remove("nav-open");
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navLinks.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("nav-open", !isOpen);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeNavigation();
  });
}

const sections = [...document.querySelectorAll("main section[id]")];
const navigationItems = [...document.querySelectorAll(".nav-links a")];

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visibleEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visibleEntry) return;

    navigationItems.forEach((link) => {
      const isCurrent = link.getAttribute("href") === `#${visibleEntry.target.id}`;
      if (isCurrent) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-24% 0px -58%", threshold: [0.08, 0.3, 0.6] });

  sections.forEach((section) => sectionObserver.observe(section));
}
