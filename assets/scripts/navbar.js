/**
 * Navigation Bar Controller
 * -------------------------
 * Handles scroll-based glass effect, mobile menu toggling, and reuses the
 * voice command logic for the navbar microphone button.
 */

(() => {
  const header = document.getElementById("site-header");
  const nav = document.getElementById("site-nav");
  const menuToggle = document.getElementById("site-menu-toggle");
  const navVoiceButton = document.getElementById("nav-voice-button");
  const conclusionsVoiceButton = document.getElementById(
    "conclusions-voice-button"
  );

  if (!header || !nav || !menuToggle || !navVoiceButton) {
    console.warn("Navbar elements are missing. Skipping navbar setup.");
    return;
  }

  const mainVoiceButton = document.getElementById("voice-button");

  // Track the shared voice state from the main button if it exists.
  const sharedVoiceState = window.__VOICE_STATE__ || {
    isListening: false,
    toggleListening: null,
    addListener(fn) {
      if (!this.listeners) this.listeners = new Set();
      this.listeners.add(fn);
    },
    notify() {
      if (!this.listeners) return;
      this.listeners.forEach((fn) => fn(this.isListening));
    },
  };

  window.__VOICE_STATE__ = sharedVoiceState;

  // Allow the main voice button script to register a toggle handler.
  if (!sharedVoiceState.toggleListening && mainVoiceButton) {
    const toggleFn = mainVoiceButton.__VOICE_TOGGLE__;
    if (typeof toggleFn === "function") {
      sharedVoiceState.toggleListening = toggleFn;
    }
  }

  const mobileMenuQuery = window.matchMedia("(max-width: 1024px)");
  let isMobileView = mobileMenuQuery.matches;

  function setMenuState(isOpen) {
    header.classList.toggle("is-menu-open", Boolean(isOpen));
    menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    if (isMobileView) {
      nav.setAttribute("aria-hidden", String(!isOpen));
    } else {
      nav.removeAttribute("aria-hidden");
    }
  }

  function closeMenu({ focusToggle = false } = {}) {
    if (!header.classList.contains("is-menu-open")) {
      if (isMobileView) nav.setAttribute("aria-hidden", "true");
      return;
    }
    setMenuState(false);
    if (focusToggle) menuToggle.focus({ preventScroll: true });
  }

  function toggleMenu() {
    if (!isMobileView) return;
    const nextState = !header.classList.contains("is-menu-open");
    setMenuState(nextState);
  }

  function syncMobileState() {
    isMobileView = mobileMenuQuery.matches;
    if (!isMobileView) {
      setMenuState(false);
      nav.removeAttribute("aria-hidden");
      return;
    }

    const isOpen = header.classList.contains("is-menu-open");
    nav.setAttribute("aria-hidden", String(!isOpen));
  }

  function syncNavVoiceButton(isListening) {
    navVoiceButton.classList.toggle("is-listening", Boolean(isListening));
    navVoiceButton.setAttribute("aria-pressed", String(Boolean(isListening)));

    // Also sync the conclusions voice button if it exists
    if (conclusionsVoiceButton) {
      conclusionsVoiceButton.classList.toggle(
        "is-listening",
        Boolean(isListening)
      );
      conclusionsVoiceButton.setAttribute(
        "aria-pressed",
        String(Boolean(isListening))
      );
    }
  }

  // Wire navbar mic to use the shared voice button logic.
  navVoiceButton.addEventListener("click", () => {
    if (typeof sharedVoiceState.toggleListening === "function") {
      sharedVoiceState.toggleListening();
    } else if (mainVoiceButton) {
      mainVoiceButton.click();
    }
  });

  // Wire conclusions mic button if it exists
  if (conclusionsVoiceButton) {
    conclusionsVoiceButton.addEventListener("click", () => {
      if (typeof sharedVoiceState.toggleListening === "function") {
        sharedVoiceState.toggleListening();
      } else if (mainVoiceButton) {
        mainVoiceButton.click();
      }
    });
  }

  sharedVoiceState.addListener(syncNavVoiceButton);
  syncNavVoiceButton(sharedVoiceState.isListening);

  menuToggle.addEventListener("click", toggleMenu);

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu({ focusToggle: true });
    }
  });

  mobileMenuQuery.addEventListener("change", syncMobileState);
  syncMobileState();
})();
