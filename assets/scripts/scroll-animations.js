/**
 * Minimal Scroll Animations
 * -------------------------
 * Subtle fade-in animations as content enters viewport
 * Excludes hero sections for immediate display
 */

(() => {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) return;

  // Selectors for content to animate (excludes hero elements)
  const ANIMATED_SELECTORS = [
    ".cs-section",
    ".project-card",
    ".overview-meta",
    ".overview-subsection",
    ".insight-card",
    ".user-quote-card",
    ".media-grid-item",
    ".experience-marquee",
    ".video-centered",
    ".user-testing-hero",
    ".user-testing-insights",
    "footer",
  ];

  // Track animated elements
  const animatedElements = new WeakSet();

  /**
   * Initialize elements for animation
   */
  function initElements() {
    ANIMATED_SELECTORS.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el, index) => {
        // Skip if already initialized or is within hero
        if (
          el.classList.contains("animate-on-scroll") ||
          el.closest(".hero") ||
          el.closest("#landing main")
        ) {
          return;
        }

        // Add animation class
        el.classList.add("animate-on-scroll");

        // Add stagger delay for grouped items
        const parent = el.parentElement;
        if (parent) {
          const siblings = parent.querySelectorAll(selector);
          if (siblings.length > 1) {
            const siblingIndex = Array.from(siblings).indexOf(el);
            el.style.setProperty("--delay", `${siblingIndex * 0.1}s`);
          }
        }
      });
    });
  }

  /**
   * Handle intersection
   */
  function handleIntersection(entries) {
    entries.forEach((entry) => {
      if (animatedElements.has(entry.target)) return;

      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        animatedElements.add(entry.target);
      }
    });
  }

  /**
   * Setup observer
   */
  function setupObserver() {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "0px 0px -80px 0px",
      threshold: 0.1,
    });

    // Observe all elements
    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });
  }

  /**
   * Check elements already in viewport
   */
  function checkInitialViewport() {
    const viewportHeight = window.innerHeight;
    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportHeight * 0.75 && rect.bottom > 0) {
        el.classList.add("is-visible");
        animatedElements.add(el);
      }
    });
  }

  /**
   * Initialize
   */
  function init() {
    initElements();
    setupObserver();
    // Small delay to ensure layout is ready
    setTimeout(checkInitialViewport, 100);
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
