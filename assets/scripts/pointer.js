/*
 * Custom Pointer Controller
 * -------------------------
 * Replaces the native cursor with a cinematic orb that reacts to context.
 */

(function initCustomPointer() {
  const supportsFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  if (!supportsFinePointer) {
    return;
  }

  const pointer = document.createElement("div");
  pointer.id = "pointer-cursor";
  pointer.className = "is-default is-hidden";

  document.body.appendChild(pointer);
  document.body.classList.add("has-custom-pointer");

  const state = {
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    currentX: window.innerWidth / 2,
    currentY: window.innerHeight / 2,
    isMoving: false,
    lastTrailX: window.innerWidth / 2,
    lastTrailY: window.innerHeight / 2,
    animationFrame: null,
    isVisible: false,
    lastMoveTime: 0,
  };

  const sharedVoiceState = window.__VOICE_STATE__;

  const lerp = (start, end, factor) => start + (end - start) * factor;

  function updatePosition() {
    state.currentX = lerp(state.currentX, state.targetX, 0.18);
    state.currentY = lerp(state.currentY, state.targetY, 0.18);

    pointer.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0)`;

    const lagFactor = 0.08;
    state.lastTrailX = lerp(state.lastTrailX, state.targetX, lagFactor);
    state.lastTrailY = lerp(state.lastTrailY, state.targetY, lagFactor);

    const offsetX = state.lastTrailX - state.currentX;
    const offsetY = state.lastTrailY - state.currentY;
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

    pointer.style.setProperty("--cursor-trail-offset-x", `${offsetX}px`);
    pointer.style.setProperty("--cursor-trail-offset-y", `${offsetY}px`);
    pointer.style.setProperty(
      "--cursor-trail-scale",
      state.isMoving ? Math.min(1.2 + distance / 120, 2.1).toFixed(3) : "1.15"
    );

    if (state.isMoving) {
      pointer.classList.add("is-moving");
    } else {
      pointer.classList.remove("is-moving");
    }

    state.animationFrame = requestAnimationFrame(updatePosition);
  }

  function setVisibility(visible) {
    if (visible === state.isVisible) return;
    state.isVisible = visible;
    pointer.classList.toggle("is-hidden", !visible);
    pointer.classList.toggle("is-visible", visible);
  }

  function handleMouseMove(event) {
    state.targetX = event.clientX;
    state.targetY = event.clientY;
    state.isMoving = true;
    state.lastMoveTime = performance.now();
    setVisibility(true);
  }

  function handleMouseLeave() {
    state.isMoving = false;
    setVisibility(false);
  }

  function handleMouseEnter(event) {
    state.targetX = event.clientX;
    state.targetY = event.clientY;
    setVisibility(true);
  }

  function handleMouseUp() {
    pointer.classList.remove("is-pressed");
  }

  function handleMouseDown() {
    pointer.classList.add("is-pressed");
  }

  function monitorMotion() {
    const now = performance.now();
    if (now - state.lastMoveTime > 120) {
      state.isMoving = false;
    }
    requestAnimationFrame(monitorMotion);
  }

  function setStateClass(className, active) {
    pointer.classList.toggle(className, active);
  }

  function applyDefaultState() {
    pointer.style.removeProperty("--cursor-color");
    setStateClass("is-default", true);
    setStateClass("is-listening", false);
    setStateClass("is-explore", false);
  }

  function applyListeningState() {
    pointer.style.setProperty("--cursor-color", "#ff7f66");
    setStateClass("is-default", false);
    setStateClass("is-explore", false);
    setStateClass("is-listening", true);
  }

  function applyExploreState(color) {
    pointer.style.setProperty(
      "--cursor-color",
      color || "rgba(245,245,245,0.85)"
    );
    setStateClass("is-default", false);
    setStateClass("is-listening", false);
    setStateClass("is-explore", true);
  }

  function determineExploreColor(element) {
    if (!element) return null;
    const accent = element.getAttribute("data-accent");
    if (accent) {
      if (/^#|rgb|hsl/i.test(accent.trim())) {
        return accent.trim();
      }
      const computed = getComputedStyle(element).getPropertyValue(
        accent.trim()
      );
      return computed || null;
    }
    const accentVar = getComputedStyle(element).getPropertyValue("--accent");
    if (accentVar) {
      return `hsl(${accentVar.trim()})`;
    }
    return null;
  }

  function handleExploreEnter(event) {
    const color = determineExploreColor(event.currentTarget);
    applyExploreState(color);
  }

  function handleExploreLeave() {
    applyDefaultState();
  }

  function handleVoiceHover() {
    applyListeningState();
  }

  function handleVoiceLeave() {
    applyDefaultState();
  }

  function syncVoiceState(isListening) {
    if (isListening) {
      applyListeningState();
    } else {
      applyDefaultState();
    }
  }

  function registerHoverTargets() {
    // All voice buttons that should show the coral pulse cursor (register first for priority)
    const listeningSelectors = [
      "#voice-button",
      "#nav-voice-button",
      "#conclusions-voice-button",
      ".nav-voice-button",
      ".side-nav-voice-button",
    ];
    
    // All clickable elements that should show the clickable cursor
    // Exclude voice buttons to avoid conflicts
    const clickableSelectors = [
      ".project-card",
      ".site-nav__link",
      "a:not(.nav-voice-button):not(.side-nav-voice-button)",
      "button:not(.nav-voice-button):not(.side-nav-voice-button):not(#voice-button):not(#nav-voice-button):not(#conclusions-voice-button)",
      ".clickable-image",
      ".voice-tag",
      ".component-card",
      "[onclick]",
      ".site-header__menu",
      ".site-nav__list a",
      ".side-nav a",
    ];

    // Register voice button listeners first so they have priority
    listeningSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.addEventListener("mouseenter", handleVoiceHover);
        element.addEventListener("mouseleave", handleVoiceLeave);
        element.addEventListener("focus", handleVoiceHover);
        element.addEventListener("blur", handleVoiceLeave);
        element.addEventListener("mousedown", () =>
          pointer.classList.add("is-pressed")
        );
        element.addEventListener("mouseup", () =>
          pointer.classList.remove("is-pressed")
        );
      });
    });

    // Register clickable element listeners
    clickableSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        // Skip if element is a voice button (double-check)
        if (
          element.id === "voice-button" ||
          element.id === "nav-voice-button" ||
          element.id === "conclusions-voice-button" ||
          element.classList.contains("nav-voice-button") ||
          element.classList.contains("side-nav-voice-button")
        ) {
          return;
        }
        element.addEventListener("mouseenter", handleExploreEnter);
        element.addEventListener("mouseleave", handleExploreLeave);
        element.addEventListener("focus", handleExploreEnter);
        element.addEventListener("blur", handleExploreLeave);
      });
    });
  }

  function initVoiceStateListeners() {
    if (
      !sharedVoiceState ||
      typeof sharedVoiceState.addListener !== "function"
    ) {
      return;
    }

    sharedVoiceState.addListener(syncVoiceState);
    syncVoiceState(Boolean(sharedVoiceState.isListening));
  }

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mousedown", handleMouseDown, true);
  window.addEventListener("mouseup", handleMouseUp, true);
  window.addEventListener("mouseenter", handleMouseEnter);
  window.addEventListener("mouseleave", handleMouseLeave);

  updatePosition();
  monitorMotion();
  registerHoverTargets();
  initVoiceStateListeners();

  document.addEventListener("visibilitychange", () => {
    setVisibility(!document.hidden);
  });

  window.addEventListener("blur", () => setVisibility(false));
  window.addEventListener("focus", () => setVisibility(true));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      setVisibility(false);
    }
  });

  document.addEventListener("focusin", () => {
    setVisibility(false);
  });

  document.addEventListener("focusout", (event) => {
    if (!event.relatedTarget) {
      setVisibility(true);
    }
  });
})();
