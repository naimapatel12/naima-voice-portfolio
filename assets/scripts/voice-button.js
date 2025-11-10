/**
 * Voice Button Controller
 * -----------------------
 * Handles the speech-recognition toggle button, microphone visualization,
 * and toast notifications that appear after commands are spoken.
 */

(() => {
  // Grab references to the UI pieces we manipulate.
  const waveformElement = document.getElementById("voice-waveform");
  const voiceButton = document.getElementById("voice-button");
  const toastContainer = document.getElementById("toast-container");

  // Only require toastContainer for showing messages - create a fallback if it doesn't exist
  let toastContainerFallback = null;
  if (!toastContainer) {
    // Create a minimal toast container if it doesn't exist (for pages without the main voice button)
    toastContainerFallback = document.createElement("div");
    toastContainerFallback.id = "toast-container";
    toastContainerFallback.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 10000; pointer-events: none;";
    document.body.appendChild(toastContainerFallback);
  }
  
  const activeToastContainer = toastContainer || toastContainerFallback;

  // If main voice button doesn't exist, we'll still set up voice recognition for navbar use
  if (!voiceButton && !waveformElement) {
    console.log("Main voice button not found - setting up voice recognition for navbar use only.");
  }

  // Create the 100 tiny bars that make up the waveform visualization (only if element exists).
  const bars = waveformElement ? Array.from({ length: 150 }).map(() => {
    const bar = document.createElement("div");
    bar.className = "waveform-bar";
    waveformElement.appendChild(bar);
    return bar;
  }) : [];

  const labelEl = voiceButton ? voiceButton.querySelector(".label") : null;
  const iconMic = voiceButton ? voiceButton.querySelector(".icon-mic") : null;
  const iconMicOff = voiceButton ? voiceButton.querySelector(".icon-mic-off") : null;

  // Check for SpeechRecognition support (Chrome, Edge, Safari, etc.).
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

  const state = {
    isListening: false,
    isSupported: Boolean(SpeechRecognition),
    recognition: null,
    audioContext: null,
    analyser: null,
    mediaStream: null,
    animationFrame: null,
    promptRotationInterval: null,
    currentPromptIndex: 0,
  };

  // Array of prompts to rotate through
  const prompts = [
    'Say "View my work"',
    'Say "Show me AI projects"',
    'Say "I want to learn more about tidbit"',
    'Say "Tell me more about Naima"',
    'Say "Open Oracle AI project"',
  ];

  const sharedState = window.__VOICE_STATE__ || {};

  sharedState.listeners = sharedState.listeners || new Set();

  sharedState.addListener =
    sharedState.addListener ||
    function addListener(handler) {
      sharedState.listeners.add(handler);
    };

  sharedState.removeListener =
    sharedState.removeListener ||
    function removeListener(handler) {
      sharedState.listeners.delete(handler);
    };

  sharedState.notify =
    sharedState.notify ||
    function notifyListeners() {
      sharedState.listeners.forEach((handler) => {
        try {
          handler(sharedState.isListening);
        } catch (error) {
          console.error("Voice state listener error:", error);
        }
      });
    };

  if (typeof sharedState.isListening !== "boolean") {
    sharedState.isListening = false;
  }

  window.__VOICE_STATE__ = sharedState;

  /** Start rotating through prompts every 3 seconds */
  function startPromptRotation() {
    // Only start rotation if main button exists
    if (!labelEl) return;
    
    // Clear any existing interval
    if (state.promptRotationInterval) {
      clearInterval(state.promptRotationInterval);
    }

    // Set up new interval
    state.promptRotationInterval = setInterval(() => {
      if (!state.isListening && labelEl) {
        state.currentPromptIndex = (state.currentPromptIndex + 1) % prompts.length;
        labelEl.textContent = prompts[state.currentPromptIndex];
      }
    }, 2000);
  }

  /** Stop rotating through prompts */
  function stopPromptRotation() {
    if (state.promptRotationInterval) {
      clearInterval(state.promptRotationInterval);
      state.promptRotationInterval = null;
    }
  }

  /** Update button copy and icon state whenever the listening mode changes. */
  function updateButtonVisuals() {
    // Update main voice button visuals if it exists
    if (voiceButton && labelEl && iconMic && iconMicOff) {
      if (!state.isSupported) {
        voiceButton.classList.add("is-disabled");
        voiceButton.setAttribute("aria-disabled", "true");
        voiceButton.setAttribute("disabled", "disabled");
        labelEl.textContent = "Voice control unavailable";
        stopPromptRotation();
        return;
      }
      const listening = state.isListening;
      sharedState.isListening = listening;

      if (listening) {
        voiceButton.classList.add("is-listening");
        voiceButton.setAttribute("aria-pressed", "true");
        labelEl.textContent = "Listening...";
        iconMic.style.display = "none";
        iconMicOff.style.display = "flex";
        stopPromptRotation();
      } else {
        voiceButton.classList.remove("is-listening");
        voiceButton.setAttribute("aria-pressed", "false");
        labelEl.textContent = prompts[state.currentPromptIndex];
        iconMic.style.display = "flex";
        iconMicOff.style.display = "none";
        startPromptRotation();
      }
    } else {
      // Just update the shared state if main button doesn't exist
      sharedState.isListening = state.isListening;
    }

    sharedState.notify();
  }

  /** Apply dynamic heights to each bar to create the waveform effect. */
  function updateWaveformHeights(values, isListening) {
    bars.forEach((bar, index) => {
      const height = isListening ? Math.max(2, values[index] || 0) : 2;
      bar.style.setProperty("--dynamic-height", `${height}px`);
      bar.style.opacity = isListening ? "0.8" : "0.3";
    });
  }

  /** Reset the waveform to the idle state when not listening. */
  function resetWaveform() {
    updateWaveformHeights([], false);
  }

  /** Create and show a toast message in the top-right corner. */
  function createToast({ title, description, variant = "default" }) {
    const toast = document.createElement("div");
    toast.className = `toast${
      variant === "destructive" ? " toast--destructive" : ""
    }`;

    const titleEl = document.createElement("div");
    titleEl.className = "toast-title";
    titleEl.textContent = title;
    toast.appendChild(titleEl);

    if (description) {
      const desc = document.createElement("div");
      desc.className = "toast-description";
      desc.textContent = description;
      toast.appendChild(desc);
    }

    activeToastContainer.appendChild(toast);

    // Delay adding the visible class so the transition animates.
    requestAnimationFrame(() => {
      toast.classList.add("toast--visible");
    });

    const timeout = setTimeout(() => {
      toast.classList.remove("toast--visible");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
    }, 3200);

    // Clicking a toast dismisses it early.
    toast.addEventListener("click", () => {
      clearTimeout(timeout);
      toast.classList.remove("toast--visible");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
    });
  }

  /**
   * Handle voice command by calling the navigation module
   */
  async function handleCommand(transcript) {
    console.info("Voice command:", transcript);
    
    // Show loading state
    createToast({
      title: "Processing...",
      description: "Understanding your command",
    });

    try {
      // Call the voice navigation module
      // API key is now handled server-side via /api/voice endpoint
      const result = await window.handleVoiceNavigation(transcript);
      
      if (result.success) {
        // Success - show confirmation
        createToast({
          title: result.message || "Navigating...",
          description: "Taking you there now",
        });
      } else {
        // Error - show what went wrong with more helpful messages
        let errorTitle = "Command not recognized";
        let errorDescription = result.message || "Please try again";
        
        // Provide more specific error messages
        if (result.message && result.message.includes("API key")) {
          errorTitle = "Configuration needed";
          errorDescription = "Please set up your API key in the .env file";
        } else if (result.message && result.message.includes("network")) {
          errorTitle = "Connection error";
          errorDescription = "Please check your internet connection";
        } else if (result.message && result.message.includes("timeout")) {
          errorTitle = "Request timed out";
          errorDescription = "Please try again";
        }
        
        createToast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Voice navigation error:", error);
      
      let errorMessage = "Please try again";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString().includes("API key")) {
        errorMessage = "API key not configured. Please check your .env file";
      }
      
      createToast({
        title: "Navigation failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  /** Create and configure a SpeechRecognition instance on first use. */
  function ensureRecognition() {
    if (!state.isSupported || state.recognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Voice command received:", transcript);

      // Process the command through our navigation module
      await handleCommand(transcript);

      stopListening();
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        createToast({
          title: "Voice recognition error",
          description: "Please try again",
          variant: "destructive",
        });
      }
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };

    state.recognition = recognition;
  }

  /**
   * Spins up a Web Audio analyser to read microphone data for the waveform
   * animation when listening is active.
   */
  async function startAudioVisualization() {
    try {
      state.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      state.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      state.analyser = state.audioContext.createAnalyser();
      const source = state.audioContext.createMediaStreamSource(
        state.mediaStream
      );

      state.analyser.fftSize = 256;
      source.connect(state.analyser);

      const bufferLength = state.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateData = () => {
        if (!state.isListening || !state.analyser) return;
        state.analyser.getByteFrequencyData(dataArray);
        const normalized = Array.from(dataArray.slice(0, bars.length)).map(
          (value) => (value / 255) * 80
        );
        updateWaveformHeights(normalized, true);
        state.animationFrame = requestAnimationFrame(updateData);
      };

      updateData();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      createToast({
        title: "Microphone access blocked",
        description: "Please enable microphone permissions",
        variant: "destructive",
      });
      stopListening();
    }
  }

  /** Tear down audio contexts and animation frames when stopping listening. */
  function stopAudioVisualization() {
    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }

    if (state.audioContext) {
      state.audioContext.close();
      state.audioContext = null;
    }

    if (state.mediaStream) {
      state.mediaStream.getTracks().forEach((track) => track.stop());
      state.mediaStream = null;
    }

    state.analyser = null;
    resetWaveform();
  }

  /** Begin listening for speech and kick off the visualizer. */
  function startListening() {
    if (!state.isSupported || state.isListening) return;

    ensureRecognition();

    if (!state.recognition) {
      createToast({
        title: "Voice control unavailable",
        description: "Your browser does not support voice recognition",
        variant: "destructive",
      });
      return;
    }

    state.recognition.start();
    state.isListening = true;
    updateButtonVisuals();
    createToast({
      title: "Listening...",
      description: "Say a command like 'see my work'",
    });
    startAudioVisualization();
  }

  /** Stop speech recognition and the accompanying visuals. */
  function stopListening() {
    if (!state.isListening) return;

    if (state.recognition) {
      try {
        state.recognition.stop();
      } catch (error) {
        console.warn("Speech recognition stop failed:", error);
      }
    }

    state.isListening = false;
    updateButtonVisuals();
    stopAudioVisualization();
  }

  // Toggle listening whenever the button is pressed (only if button exists).
  if (voiceButton) {
    voiceButton.addEventListener("click", () => {
      if (!state.isSupported) {
        createToast({
          title: "Not supported",
          description: "Voice recognition is not supported in your browser",
          variant: "destructive",
        });
        return;
      }

      if (state.isListening) {
        stopListening();
      } else {
        startListening();
      }
    });
  }

  sharedState.toggleListening =
    sharedState.toggleListening ||
    function toggle() {
      if (!state.isSupported) {
        createToast({
          title: "Not supported",
          description: "Voice recognition is not supported in your browser",
          variant: "destructive",
        });
        return;
      }

      if (state.isListening) {
        stopListening();
      } else {
        startListening();
      }
    };

  // Store toggle function on button if it exists (for navbar.js compatibility)
  if (voiceButton) {
    voiceButton.__VOICE_TOGGLE__ = sharedState.toggleListening;
    voiceButton.__VOICE_STATE__ = sharedState;
  }
  sharedState.notify();

  // Make sure we release the microphone and stop rotation if the tab is closed/refreshed.
  window.addEventListener("beforeunload", () => {
    stopListening();
    stopPromptRotation();
  });

  // Initial UI setup based on feature support.
  if (!state.isSupported) {
    updateButtonVisuals();
    if (voiceButton) {
      createToast({
        title: "Voice control unavailable",
        description: "Your browser does not support speech recognition",
        variant: "destructive",
      });
    }
  } else {
    if (waveformElement) {
      resetWaveform();
    }
    updateButtonVisuals();
  }
})();
