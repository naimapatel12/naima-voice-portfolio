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

  /**
   * Load environment variables from .env file (development only)
   * In production, these would come from a backend proxy
   */
  async function loadEnvFile() {
    try {
      const response = await fetch('/.env');
      if (!response.ok) {
        console.warn('No .env file found. Please create one with your OPENAI_API_KEY.');
        return;
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

      console.log('Environment variables loaded successfully');
    } catch (error) {
      console.error('Failed to load .env file:', error);
    }
  }

  // Load environment variables immediately
  loadEnvFile();

  // Export a helper function to get env variables
  window.getEnv = function(key) {
    return window.ENV[key];
  };
})();

