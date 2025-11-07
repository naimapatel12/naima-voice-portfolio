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
    const apiKey = window.getEnv ? window.getEnv('OPENAI_API_KEY') : window.ENV?.OPENAI_API_KEY;
    
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
- projects: Portfolio projects section
- resume: Resume section
- landing/home: Landing page

STANDALONE PAGES:
- about: About page (about.html)

PROJECT PAGES:
- oracle-ai: Oracle AI project page
- tidbit: Tidbit project page
- tunein: TuneIn project page
- oracle: Oracle project page

PROJECT PAGE SECTIONS (within project pages):
- overview: Project overview
- research: Research section
- final-designs: Final designs section
- takeaways: Takeaways/conclusions section
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

Examples:
- "show me your work" -> {"action": "navigate_section", "target": "projects", "confidence": 0.95}
- "tell me more about naima" -> {"action": "navigate_page", "target": "about", "confidence": 0.95}
- "tell me about you" -> {"action": "navigate_page", "target": "about", "confidence": 0.9}
- "who are you" -> {"action": "navigate_page", "target": "about", "confidence": 0.85}
- "open oracle ai" -> {"action": "navigate_project", "target": "oracle-ai", "confidence": 0.9}
- "go to final designs" -> {"action": "navigate_project_section", "target": "final-designs", "confidence": 0.85}
- "take me home" -> {"action": "go_home", "target": "landing", "confidence": 0.95}`;

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
        return {
          success: false,
          error: 'Empty response from API'
        };
      }

      // Parse the JSON response
      const result = JSON.parse(content);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute the navigation based on the interpreted command
   */
  function executeNavigation(interpretation, context) {
    const { action, target, confidence } = interpretation;

    // Low confidence threshold
    if (confidence < 0.5) {
      return {
        success: false,
        message: 'Command unclear. Try "show my work" or "go to projects"'
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
        const project = NAVIGATION_MAP.projects[target] || NAVIGATION_MAP.projects[target.replace('-', ' ')];
        if (!project) {
          return { success: false, message: `Project "${target}" not found` };
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
        message: 'Could not understand command. Please try again.'
      };
    }

    console.log('Interpreted command:', interpretation.data);

    // Execute the navigation
    const result = executeNavigation(interpretation.data, context);
    return result;
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

