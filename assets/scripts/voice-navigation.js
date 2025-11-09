/**
 * Voice Navigation Module
 * -----------------------
 * Handles natural language voice commands and translates them into
 * navigation actions using OpenAI's GPT-4o-mini API.
 * 
 * This module is called by voice-button.js when a voice command is captured.
 */

(() => {
  /**
   * Navigation map defining all possible navigation targets
   */
  const NAVIGATION_MAP = {
    // Main sections on index.html
    sections: {
      projects: { target: '#projects', page: 'index.html' },
      resume: { target: '#resume', page: 'index.html' },
      landing: { target: '#landing', page: 'index.html' },
      home: { target: '#landing', page: 'index.html' }
    },
    
    // Standalone pages
    pages: {
      about: { target: 'about.html' }
    },
    
    // Project pages
    projects: {
      'oracle-ai': { target: 'oracle-ai.html' },
      'oracle ai': { target: 'oracle-ai.html' },
      'tidbit': { target: 'tidbit.html' },
      'tunein': { target: 'tunein.html' },
      'tune in': { target: 'tunein.html' },
      'oracle': { target: 'oracle.html' }
    },
    
    // Common sections within project pages
    projectSections: {
      overview: '#overview',
      research: '#research',
      'final designs': '#final-designs',
      designs: '#final-designs',
      takeaways: '#takeaways',
      conclusions: '#takeaways',
      process: '#process',
      ideation: '#ideation',
      prototyping: '#prototyping',
      testing: '#testing'
    }
  };

  /**
   * Get the current page name from the URL
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page === '' ? 'index.html' : page;
  }

  /**
   * Check if we're currently on the index page
   */
  function isOnIndexPage() {
    const page = getCurrentPage();
    return page === 'index.html' || page === '';
  }

  /**
   * Check if we're currently on a project page
   */
  function isOnProjectPage() {
    const page = getCurrentPage();
    return ['oracle-ai.html', 'tidbit.html', 'tunein.html', 'oracle.html'].includes(page);
  }

  /**
   * Navigate to a specific target
   */
  function navigateTo(target, isSection = false) {
    if (target.startsWith('#')) {
      // Section navigation - smooth scroll
      const element = document.querySelector(target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    } else {
      // Page navigation
      window.location.href = target;
      return true;
    }
  }

  /**
   * Call OpenAI API to interpret the voice command
   */
  async function interpretCommand(transcript, context) {
    // Wait for API key to be loaded
    let apiKey;
    try {
      apiKey = await window.waitForApiKey();
    } catch (error) {
      console.error('Failed to load API key:', error);
      return {
        success: false,
        error: 'API key not configured. Please create a .env file with OPENAI_API_KEY=your-key-here'
      };
    }
    
    if (!apiKey) {
      console.error('OpenAI API key not found');
      return {
        success: false,
        error: 'API key not configured'
      };
    }

    const systemPrompt = `You are a navigation assistant for Naima Patel's portfolio website. 
Your job is to interpret voice commands and determine the user's navigation intent.

Current context:
- Current page: ${context.currentPage}
- Is on index page: ${context.isOnIndexPage}
- Is on project page: ${context.isOnProjectPage}

Available navigation targets:

MAIN SECTIONS (on index.html):
- projects: Portfolio projects section (use for "work", "portfolio", "projects", "my work", "your work")
- resume: Resume section
- landing/home: Landing page

STANDALONE PAGES:
- about: About page (about.html) - use for anything about Naima, "who is", "tell me about", "about page", "about Naima"

PROJECT PAGES:
- oracle-ai: Oracle AI project page (use for "oracle ai", "oracle AI", "oracle-ai", "financial planning")
- tidbit: Tidbit project page (use for "tidbit", "tidbit page", "tidbit project", "scrapbooking")
- tunein: TuneIn project page (use for "tunein", "tune in", "tunein project", "audio profiles")
- oracle: Oracle project page (use for "oracle", "oracle project", "components")

PROJECT PAGE SECTIONS (within project pages):
- overview: Project overview
- research: Research section
- final-designs: Final designs section (also "designs", "final design")
- takeaways: Takeaways/conclusions section (also "conclusions", "takeaway")
- process: Process section
- ideation: Ideation section
- prototyping: Prototyping section
- testing: Testing section

Respond with ONLY a JSON object in this exact format:
{
  "action": "navigate_section" | "navigate_page" | "navigate_project" | "navigate_project_section" | "go_home" | "unknown",
  "target": "target-name",
  "confidence": 0.0-1.0
}

IMPORTANT: Be flexible with natural language. Understand variations and synonyms:
- "show me the tidbit page" = navigate_project, target: "tidbit"
- "tell me more about Naima" = navigate_page, target: "about"
- "show me your work" = navigate_section, target: "projects"
- "view my portfolio" = navigate_section, target: "projects"
- "go to about" = navigate_page, target: "about"
- "who is Naima" = navigate_page, target: "about"
- "about page" = navigate_page, target: "about"
- "open tidbit" = navigate_project, target: "tidbit"
- "show tidbit project" = navigate_project, target: "tidbit"
- "oracle ai project" = navigate_project, target: "oracle-ai"
- "tunein page" = navigate_project, target: "tunein"

Examples:
- "show me your work" -> {"action": "navigate_section", "target": "projects", "confidence": 0.95}
- "view my portfolio" -> {"action": "navigate_section", "target": "projects", "confidence": 0.95}
- "show me the projects" -> {"action": "navigate_section", "target": "projects", "confidence": 0.95}
- "tell me more about naima" -> {"action": "navigate_page", "target": "about", "confidence": 0.95}
- "tell me about you" -> {"action": "navigate_page", "target": "about", "confidence": 0.9}
- "who are you" -> {"action": "navigate_page", "target": "about", "confidence": 0.85}
- "about page" -> {"action": "navigate_page", "target": "about", "confidence": 0.95}
- "show me the tidbit page" -> {"action": "navigate_project", "target": "tidbit", "confidence": 0.95}
- "open tidbit" -> {"action": "navigate_project", "target": "tidbit", "confidence": 0.9}
- "go to tidbit" -> {"action": "navigate_project", "target": "tidbit", "confidence": 0.9}
- "tidbit project" -> {"action": "navigate_project", "target": "tidbit", "confidence": 0.9}
- "open oracle ai" -> {"action": "navigate_project", "target": "oracle-ai", "confidence": 0.9}
- "oracle ai project" -> {"action": "navigate_project", "target": "oracle-ai", "confidence": 0.9}
- "go to final designs" -> {"action": "navigate_project_section", "target": "final-designs", "confidence": 0.85}
- "take me home" -> {"action": "go_home", "target": "landing", "confidence": 0.95}
- "go home" -> {"action": "go_home", "target": "landing", "confidence": 0.95}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);
        return {
          success: false,
          error: `API error: ${response.status}`
        };
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      
      if (!content) {
        console.error('Empty response from OpenAI API');
        return {
          success: false,
          error: 'Empty response from API. Please try again.'
        };
      }

      // Parse the JSON response with error handling
      let result;
      try {
        // Try to extract JSON from the response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        result = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        console.error('Response content:', content);
        return {
          success: false,
          error: 'Failed to understand response. Please try again.'
        };
      }

      // Validate the response structure
      if (!result.action || !result.target) {
        console.error('Invalid response structure:', result);
        return {
          success: false,
          error: 'Invalid response format. Please try again.'
        };
      }

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to process command. Please try again.';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Execute the navigation based on the interpreted command
   */
  function executeNavigation(interpretation, context) {
    const { action, target, confidence } = interpretation;

    // Lower confidence threshold to be more permissive with natural language
    if (confidence < 0.4) {
      return {
        success: false,
        message: 'Command unclear. Try "show my work", "go to about", or "open tidbit"'
      };
    }

    switch (action) {
      case 'go_home':
        if (context.isOnIndexPage) {
          navigateTo('#landing', true);
          return { success: true, message: 'Going to landing page' };
        } else {
          navigateTo('index.html');
          return { success: true, message: 'Going home' };
        }

      case 'navigate_section':
        const section = NAVIGATION_MAP.sections[target];
        if (!section) {
          return { success: false, message: `Section "${target}" not found` };
        }
        
        if (context.isOnIndexPage) {
          // Already on index, just scroll
          navigateTo(section.target, true);
          return { success: true, message: `Going to ${target}` };
        } else {
          // Navigate to index page with section hash
          navigateTo(`index.html${section.target}`);
          return { success: true, message: `Going to ${target}` };
        }

      case 'navigate_page':
        const page = NAVIGATION_MAP.pages[target];
        if (!page) {
          return { success: false, message: `Page "${target}" not found` };
        }
        
        navigateTo(page.target);
        return { success: true, message: `Going to ${target} page` };

      case 'navigate_project':
        // Try exact match first
        let project = NAVIGATION_MAP.projects[target];
        
        // Try with spaces replaced by hyphens
        if (!project) {
          project = NAVIGATION_MAP.projects[target.replace(/\s+/g, '-')];
        }
        
        // Try with hyphens replaced by spaces
        if (!project) {
          project = NAVIGATION_MAP.projects[target.replace(/-/g, ' ')];
        }
        
        // Try case-insensitive match
        if (!project) {
          const lowerTarget = target.toLowerCase();
          for (const key in NAVIGATION_MAP.projects) {
            if (key.toLowerCase() === lowerTarget) {
              project = NAVIGATION_MAP.projects[key];
              break;
            }
          }
        }
        
        if (!project) {
          return { success: false, message: `Project "${target}" not found. Available: tidbit, oracle-ai, tunein, oracle` };
        }
        
        navigateTo(project.target);
        return { success: true, message: `Opening ${target} project` };

      case 'navigate_project_section':
        if (!context.isOnProjectPage) {
          return { 
            success: false, 
            message: 'Navigate to a project page first' 
          };
        }
        
        const projectSection = NAVIGATION_MAP.projectSections[target];
        if (!projectSection) {
          return { success: false, message: `Section "${target}" not found` };
        }
        
        const scrolled = navigateTo(projectSection, true);
        if (scrolled) {
          return { success: true, message: `Going to ${target}` };
        } else {
          return { success: false, message: `Section "${target}" not available on this page` };
        }

      case 'unknown':
      default:
        return {
          success: false,
          message: 'Command not recognized. Try "show my work" or "go to about"'
        };
    }
  }

  /**
   * Main handler for voice navigation
   * Called by voice-button.js when a voice command is received
   */
  async function handleVoiceNavigation(transcript) {
    console.log('Processing voice command:', transcript);

    try {
      // Get current context
      const context = {
        currentPage: getCurrentPage(),
        isOnIndexPage: isOnIndexPage(),
        isOnProjectPage: isOnProjectPage()
      };

      // Interpret the command using OpenAI
      const interpretation = await interpretCommand(transcript, context);

      if (!interpretation.success) {
        console.error('Failed to interpret command:', interpretation.error);
        return {
          success: false,
          message: interpretation.error || 'Could not understand command. Please try again.'
        };
      }

      console.log('Interpreted command:', interpretation.data);

      // Execute the navigation
      const result = executeNavigation(interpretation.data, context);
      return result;
    } catch (error) {
      console.error('Unexpected error in voice navigation:', error);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  // Export the main function globally
  window.handleVoiceNavigation = handleVoiceNavigation;

  // Also export for debugging
  window.__VOICE_NAV__ = {
    interpretCommand,
    executeNavigation,
    getCurrentPage,
    NAVIGATION_MAP
  };

  console.log('Voice navigation module loaded');
})();

