/**
 * Environment Variable Loader
 * ---------------------------
 * Simple development-mode environment variable loader.
 * In production, this will be replaced with a backend proxy.
 * 
 * NOTE: The .env file should contain:
 * OPENAI_API_KEY=your-key-here
 */

(() => {
  // Create a global config object to store environment variables
  window.ENV = window.ENV || {};

  // Track loading state
  let loadingPromise = null;
  let isLoaded = false;
  let loadAttempts = 0;
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY = 1000; // 1 second

  /**
   * Load environment variables from .env file (development only)
   * In production, these would come from a backend proxy
   * 
   * Tries multiple methods:
   * 1. Check if env.js already loaded the key (works for direct file access)
   * 2. Try fetching .env file (works with local server)
   */
  async function loadEnvFile() {
    // First, check if env.js already set the API key
    if (window.ENV && window.ENV.OPENAI_API_KEY) {
      console.log('Environment variables loaded from env.js');
      return true;
    }

    // Try to fetch .env file (works when using a local server)
    try {
      const response = await fetch('/.env');
      if (!response.ok) {
        // If fetch fails, check if we're in file:// protocol
        if (window.location.protocol === 'file:') {
          console.warn('Opening file directly (file://). Using env.js instead of .env file.');
          // env.js should have been loaded, check again
          if (window.ENV && window.ENV.OPENAI_API_KEY) {
            return true;
          }
        }
        console.warn('No .env file found. Please create one with your OPENAI_API_KEY or use env.js.');
        return false;
      }

      const text = await response.text();
      const lines = text.split('\n');
      
      lines.forEach(line => {
        // Skip empty lines and comments
        if (!line.trim() || line.trim().startsWith('#')) return;
        
        // Parse KEY=VALUE format
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          window.ENV[key.trim()] = value;
        }
      });

      console.log('Environment variables loaded from .env file');
      return true;
    } catch (error) {
      // If fetch fails (CORS, file:// protocol, etc.), check if env.js loaded it
      if (window.ENV && window.ENV.OPENAI_API_KEY) {
        console.log('Environment variables loaded from env.js (fallback)');
        return true;
      }
      console.error('Failed to load .env file:', error);
      return false;
    }
  }

  /**
   * Wait for API key to be loaded
   * Returns a promise that resolves when the API key is available
   */
  async function waitForApiKey(timeout = 5000) {
    // If already loaded and key exists, resolve immediately
    if (isLoaded && window.ENV.OPENAI_API_KEY) {
      return window.ENV.OPENAI_API_KEY;
    }

    // If key is already available (e.g., manually set), resolve immediately
    if (window.ENV.OPENAI_API_KEY) {
      isLoaded = true;
      return window.ENV.OPENAI_API_KEY;
    }

    // If loading is in progress, wait for it
    if (loadingPromise) {
      return loadingPromise;
    }

    // Start loading process
    loadingPromise = (async () => {
      const startTime = Date.now();
      
      while (loadAttempts < MAX_ATTEMPTS) {
        loadAttempts++;
        const loaded = await loadEnvFile();
        
        if (loaded && window.ENV.OPENAI_API_KEY) {
          isLoaded = true;
          return window.ENV.OPENAI_API_KEY;
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          throw new Error('Timeout waiting for API key to load');
        }

        // Wait before retry
        if (loadAttempts < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }

      // If we get here, loading failed
      throw new Error('API key not found. Please create a .env file with OPENAI_API_KEY=your-key-here');
    })();

    return loadingPromise;
  }

  // Start loading environment variables immediately
  loadEnvFile().then(loaded => {
    if (loaded) {
      isLoaded = true;
    }
  });

  // Export a helper function to get env variables
  window.getEnv = function(key) {
    return window.ENV[key];
  };

  // Export waitForApiKey function
  window.waitForApiKey = waitForApiKey;
})();

