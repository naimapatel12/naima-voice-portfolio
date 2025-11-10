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
    
    // Sections within about page
    aboutSections: {
      'why-voice': '#why-voice',
      'my-art': '#my-art',
      'art': '#my-art',
      'music-experience': '#music-experience',
      'music': '#music-experience',
      'interests-hobbies': '#interests-hobbies',
      'hobbies': '#interests-hobbies',
      'interests': '#interests-hobbies'
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
      testing: '#testing',
      'key-opportunity': '#key-opportunity',
      'key opportunity': '#key-opportunity',
      'user-interviews': '#user-interviews',
      'user interviews': '#user-interviews',
      'initial-designs': '#initial-designs',
      'initial designs': '#initial-designs',
      'need-finding': '#need-finding',
      'need finding': '#need-finding',
      'prototype-1': '#prototype-1',
      'prototype 1': '#prototype-1',
      'prototype-2': '#prototype-2',
      'prototype 2': '#prototype-2',
      'user-testing': '#user-testing',
      'user testing': '#user-testing'
    },
    
    // Filter chips/tags for project filtering
    filterChips: {
      'ai-design': 'ai',
      'ai design': 'ai',
      'ai interaction design': 'ai',
      'web-design': 'web',
      'web design': 'web',
      'mobile': 'mobile',
      'mobile design': 'mobile',
      'consumer': 'consumer',
      'consumer product': 'consumer',
      'consumer projects': 'consumer',
      'enterprise': 'enterprise',
      'enterprise design': 'enterprise'
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
   * Check if we're currently on the about page
   */
  function isOnAboutPage() {
    const page = getCurrentPage();
    return page === 'about.html';
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
   * Call serverless API to interpret the voice command
   * The API key is handled server-side for security
   */
  async function interpretCommand(transcript, context) {
    const systemPrompt = `/*
 * ============================================================================
 * MULTI-LEVEL INTELLIGENT ROUTING SYSTEM
 * ============================================================================
 * 
 * This system provides three levels of intelligent routing:
 * 
 * Level 1 → Page Navigation: Choose the target page (index, about, projects)
 * Level 2 → Section Navigation: Choose specific sections within pages
 * Level 3 → Content Filtering: Apply filters based on design disciplines/tags
 * 
 * NEW CAPABILITIES:
 * - Section-level navigation within project pages (overview, research, final-designs, etc.)
 * - Section-level navigation within about page (art, music, hobbies, etc.)
 * - Project filtering by design discipline chips (AI Design, Web Design, Mobile, Consumer, Enterprise)
 * - Context-aware routing that prioritizes section navigation when already on a project page
 * - Semantic understanding of filter requests even without exact chip names
 * 
 * NEW ACTIONS:
 * - "filter_projects": Filter projects on index page by design discipline tag
 * - "navigate_section": Navigate to sections within the about page
 * - "navigate_project_section": Navigate to sections within project pages (enhanced)
 * 
 * EXAMPLE USE CASES:
 * - "show me AI design projects" → filter_projects: ai-design
 * - "go to Oracle AI final designs" → navigate_project_section: final-designs (if on oracle-ai page)
 * - "show me web design" → filter_projects: web-design
 * - "take me to TuneIn process" → navigate_project_section: process (if on tunein page)
 * - "show me your music experience" → navigate_section: music-experience (if on about page)
 * - "go to art section on about page" → navigate_section: my-art (if on about page)
 * ============================================================================
 */

You are an intelligent multi-level content routing system for Naima Patel's portfolio website. 
Your role is to understand the semantic intent behind voice queries and route users through three levels:
1. Page selection (index, about, specific project)
2. Section selection within pages (overview, research, final-designs, art, music, etc.)
3. Content filtering by design disciplines (AI Design, Web Design, Mobile, Consumer, Enterprise)

Think of yourself as a smart hierarchical router that matches user queries to the most semantically relevant destination based on content, context, and user intent.

Current context:
- Current page: ${context.currentPage}
- Is on index page: ${context.isOnIndexPage}
- Is on project page: ${context.isOnProjectPage}
- Is on about page: ${context.isOnAboutPage}

AVAILABLE DESTINATIONS AND THEIR CONTENT:

MAIN SECTIONS (on index.html):
- projects: Overview of all portfolio projects (use when user wants to see work, portfolio, projects, or browse multiple projects)
- resume: Resume/CV section (use for resume, CV, experience, qualifications, background)
- landing/home: Landing page with introduction (use for home, start, beginning, or general queries)

STANDALONE PAGES:
- about: About page (about.html) - Contains:
  * Personal information about Naima (who she is, background, education at Stanford)
  * Visual art portfolio (paintings, prints, drawings)
  * Music experience (booking Doechii for Frost Fest, concert production)
  * Hobbies and interests (art, music, hiking, running, sports, jewelry, surfing, dance, festivals, tennis)
  * Voice AI fellowship experience
  * Personal stories and personality
  Use for: questions about Naima personally, art, music, hobbies, interests, background, "who is", "tell me about", personal life, visual art, concerts, events

AVAILABLE PAGE SECTIONS (about.html):
- why-voice: Voice AI fellowship experience and motivation
- my-art: Visual art portfolio (paintings, prints, drawings)
- music-experience: Music experience, concert production, booking Doechii
- interests-hobbies: Hobbies and personal interests (art, music, hiking, running, sports, jewelry, surfing, dance, festivals, tennis)

PROJECT PAGES:
- oracle-ai: Oracle AI project (oracle-ai.html) - Contains:
  * AI-driven financial planning tool
  * Enterprise design work
  * AI interaction design
  * Financial technology, planning tools
  Tags: AI Interaction Design, Web Design, Enterprise Design
  Use for: financial planning, AI financial tools, enterprise AI, Oracle AI, financial technology, enterprise AI tools

AVAILABLE PAGE SECTIONS (oracle-ai.html):
- overview: Project overview and introduction
- research: Research section, user research, market research
- key-opportunity: Key opportunity identified through research
- ideation: Ideation section, brainstorming, initial design concepts
- final-designs: Final designs section (also "designs", "final design", "design outcomes")
- takeaways: Takeaways/conclusions section (also "conclusions", "takeaway", "learnings", "insights")

- tidbit: Tidbit project (tidbit.html) - Contains:
  * Social scrapbooking platform
  * Mobile design work
  * Consumer product design
  * Capstone project
  * Social documentation, memory sharing
  Tags: Mobile Design, Consumer Product
  Use for: scrapbooking, social documentation, mobile apps, social platforms, memory sharing, capstone, social media design

AVAILABLE PAGE SECTIONS (tidbit.html):
- overview: Project overview and introduction
- user-interviews: User interviews and research findings
- key-opportunity: Key opportunity identified through research
- research: Research section, user research, market research, testing
- initial-designs: Initial designs section (also "initial design", "early designs")
- final-designs: Final designs section (also "designs", "final design", "design outcomes")
- conclusions: Conclusions and reflections section (also "conclusions", "takeaway", "learnings", "insights")

- tunein: TuneIn project (tunein.html) - Contains:
  * AI-powered audio profiles
  * Consumer product design
  * Mobile design
  * AI interaction design for audio
  * Audio personalization, music recommendations
  Tags: AI Interaction Design, Consumer Project, Mobile Design
  Use for: audio profiles, music recommendations, audio AI, TuneIn, music apps, audio personalization, music technology

AVAILABLE PAGE SECTIONS (tunein.html):
- overview: Project overview and introduction
- need-finding: Need-finding research section
- key-opportunity: Key opportunity identified through research
- ideation: Ideation section, brainstorming, concepts
- prototype-1: First prototype section
- prototype-2: Second prototype section
- user-testing: User testing section (also "testing", "user testing", "validation")
- final-designs: Final designs section (also "designs", "final design", "design outcomes")
- conclusions: Conclusions section (also "conclusions", "takeaway", "learnings", "insights")

- oracle: Oracle project (oracle.html) - Contains:
  * Creating smart components
  * Web design work
  * Enterprise design
  * Internship work
  * Component design, design systems
  Tags: Web Design, Enterprise Design
  Use for: components, design systems, web components, enterprise design, Oracle internship, UI components

AVAILABLE PAGE SECTIONS (oracle.html):
- overview: Project overview and introduction
- research: Research section, user research, market research
- key-opportunity: Key opportunity identified through research
- ideation: Ideation section, brainstorming, initial design concepts
- final-designs: Final designs section (also "designs", "final design", "design outcomes")
- takeaways: Takeaways/conclusions section (also "conclusions", "takeaway", "learnings", "insights")

FILTER CHIPS / DESIGN DISCIPLINES:
The portfolio uses filter chips to categorize projects by design discipline. These can be used to filter projects on the index page:
- ai-design (also "AI Design", "AI Interaction Design", "artificial intelligence", "AI work", "AI projects"): Filters projects tagged with AI Interaction Design
- web-design (also "Web Design", "web", "website design", "web projects"): Filters projects tagged with Web Design
- mobile (also "Mobile Design", "mobile", "mobile apps", "mobile projects"): Filters projects tagged with Mobile Design
- consumer (also "Consumer Product", "Consumer Projects", "consumer", "social apps", "consumer apps"): Filters projects tagged with Consumer Product/Consumer Projects
- enterprise (also "Enterprise Design", "enterprise", "enterprise projects", "B2B"): Filters projects tagged with Enterprise Design

MAPPING STRATEGY:
1. Analyze the semantic meaning of the query - what is the user really asking about or interested in?
2. Determine the routing level needed: page → section → filter (if applicable)
3. Match to the destination whose content best addresses that topic or question
4. Consider synonyms, related concepts, and contextual clues
5. For ambiguous queries, choose the most general relevant destination (projects section or about page)
6. For questions about specific topics (art, music, hobbies), route to about page or specific about sections
7. For questions about work/projects, route to projects section or specific project page
8. For questions about design process, research, or project details, route to relevant project page or section
9. For filter requests (AI, web, mobile, consumer, enterprise), use filter_projects action

CONTEXTUAL AWARENESS RULES:
- If user is already on a project page:
  * Prioritize section-level navigation (navigate_project_section)
  * If they mention "filter", "AI", "web", "consumer", "enterprise", "mobile" without a project name, navigate to index and apply filter
  * If they mention both a project and a section, navigate to that section on the current page (if it exists)
- If user is on the index page:
  * Prefer filtering (filter_projects) or general project navigation (navigate_section: projects)
  * If they mention a specific project name, navigate to that project
- If user is on the about page:
  * Prioritize section-level navigation (navigate_section) to about subsections
  * Route to sections like "art", "music", "hobbies" based on content mentioned

TIE-BREAKING RULES:
- If query references both a project and a filter ("Oracle AI design", "show me Oracle AI's AI work"):
  * Go to project page first (navigate_project), then optionally navigate to relevant section
- If query references a general tag without project name ("show me AI design", "filter by web"):
  * Trigger filter_projects action with appropriate chip name
- If query references a project and a section ("show me TuneIn's testing", "Oracle AI research"):
  * If on that project page: navigate_project_section with the section name
  * If not on that project page: navigate_project to the project (section navigation will be handled by page load)
- If query is ambiguous between filter and project:
  * Prefer project navigation if a specific project name is mentioned
  * Prefer filter if only a general discipline is mentioned

Respond with ONLY a JSON object in this exact format:
{
  "action": "navigate_section" | "navigate_page" | "navigate_project" | "navigate_project_section" | "filter_projects" | "go_home",
  "target": "target-name-or-section-or-tag",
  "confidence": 0.0-1.0
}

CRITICAL INSTRUCTIONS:
- You MUST always output a destination. Never return "unknown" or any other action.
- ALWAYS route somewhere - even if confidence is low, choose the most likely destination based on semantic similarity
- If a query is ambiguous or unclear, route to the most general relevant page (projects section for work queries, about page for personal queries)
- Use semantic understanding to map queries to content, not just exact keyword matches
- For filter_projects action, use the chip name format: "ai-design", "web-design", "mobile", "consumer", "enterprise"
- For navigate_section on about page, use: "why-voice", "my-art", "music-experience", "interests-hobbies"
- For navigate_project_section, use section names like: "overview", "research", "final-designs", "takeaways", "ideation", etc.
- Think semantically: "show me art" → navigate_section: my-art (if on about) or navigate_page: about (if not on about)
- Think semantically: "show me AI work" → filter_projects: ai-design (if on index) or navigate to index then filter
- Think semantically: "go to Oracle AI research" → navigate_project_section: research (if on oracle-ai page) or navigate_project: oracle-ai (if not)
- For questions about Naima personally, her interests, hobbies, art, music → about page or about sections
- For questions about specific projects or work → relevant project page
- For general work/portfolio queries → projects section
- For resume/experience queries → resume section
- FALLBACK ROUTING: If you cannot determine the exact destination, use these defaults:
  * Work/project-related queries → navigate_section: projects
  * Personal/about queries → navigate_page: about
  * Unclear queries → navigate_section: projects (most general destination)

EXAMPLES OF SEMANTIC MAPPING:

Page & Section Navigation:
- "show me your art" → {"action": "navigate_section", "target": "my-art", "confidence": 0.95} (if on about) OR {"action": "navigate_page", "target": "about", "confidence": 0.95} (if not on about)
- "go to art section on about page" → {"action": "navigate_section", "target": "my-art", "confidence": 0.9}
- "show me your music experience" → {"action": "navigate_section", "target": "music-experience", "confidence": 0.95} (if on about) OR {"action": "navigate_page", "target": "about", "confidence": 0.9} (if not on about)
- "tell me about you" → {"action": "navigate_page", "target": "about", "confidence": 0.95}
- "who is naima" → {"action": "navigate_page", "target": "about", "confidence": 0.95}

Project Navigation:
- "what's your capstone project" → {"action": "navigate_project", "target": "tidbit", "confidence": 0.95}
- "tell me about financial planning" → {"action": "navigate_project", "target": "oracle-ai", "confidence": 0.9}
- "show me audio profiles" → {"action": "navigate_project", "target": "tunein", "confidence": 0.9}
- "what's your scrapbooking project" → {"action": "navigate_project", "target": "tidbit", "confidence": 0.95}
- "what's your internship work" → {"action": "navigate_project", "target": "oracle", "confidence": 0.85}

Project Section Navigation:
- "go to Oracle AI final designs" → {"action": "navigate_project_section", "target": "final-designs", "confidence": 0.9} (if on oracle-ai page)
- "show me TuneIn's testing" → {"action": "navigate_project_section", "target": "user-testing", "confidence": 0.9} (if on tunein page)
- "take me to TuneIn process" → {"action": "navigate_project_section", "target": "ideation", "confidence": 0.85} (if on tunein page, using ideation as process-related)
- "show me Oracle AI research" → {"action": "navigate_project_section", "target": "research", "confidence": 0.9} (if on oracle-ai page)
- "go to Tidbit conclusions" → {"action": "navigate_project_section", "target": "conclusions", "confidence": 0.9} (if on tidbit page)

Filter Navigation:
- "show me AI design projects" → {"action": "filter_projects", "target": "ai-design", "confidence": 0.95}
- "show me web design" → {"action": "filter_projects", "target": "web-design", "confidence": 0.9}
- "filter by mobile" → {"action": "filter_projects", "target": "mobile", "confidence": 0.95}
- "show me consumer projects" → {"action": "filter_projects", "target": "consumer", "confidence": 0.9}
- "show me enterprise work" → {"action": "filter_projects", "target": "enterprise", "confidence": 0.9}
- "show me your AI work" → {"action": "filter_projects", "target": "ai-design", "confidence": 0.9}

General Navigation:
- "show me your work" → {"action": "navigate_section", "target": "projects", "confidence": 0.95}
- "show me your resume" → {"action": "navigate_section", "target": "resume", "confidence": 0.95}
- "go home" → {"action": "go_home", "target": "landing", "confidence": 0.95}

Combined Examples (Project + Section/Filter):
- "show me Oracle AI's final designs" → {"action": "navigate_project_section", "target": "final-designs", "confidence": 0.9} (if on oracle-ai) OR {"action": "navigate_project", "target": "oracle-ai", "confidence": 0.85} (if not on oracle-ai)
- "Oracle AI design" → {"action": "navigate_project", "target": "oracle-ai", "confidence": 0.85} (prefer project over filter when project name is mentioned)`;

    try {
      // Call our serverless function instead of OpenAI directly
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt,
          transcript
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        return {
          success: false,
          error: errorData.error || `API error: ${response.status}`
        };
      }

      const data = await response.json();
      const content = data.reply?.trim();
      
      if (!content) {
        console.error('Empty response from API');
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
        // Fallback: create a default navigation to projects section
        result = {
          action: 'navigate_section',
          target: 'projects',
          confidence: 0.3
        };
      }

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error calling voice API:', error);
      
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
   * Always routes somewhere - uses fallbacks if exact match not found
   */
  function executeNavigation(interpretation, context) {
    const { action, target, confidence } = interpretation;

    // Always route somewhere, even with low confidence
    // Lower confidence just means we'll use more general fallbacks

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
        // Check if it's an about page section
        const aboutSection = NAVIGATION_MAP.aboutSections[target];
        if (aboutSection) {
          if (context.isOnAboutPage) {
            // Already on about page, just scroll
            const scrolled = navigateTo(aboutSection, true);
            if (scrolled) {
              return { success: true, message: `Going to ${target}` };
            } else {
              // Fallback: scroll to top of about page
              navigateTo('#why-voice', true);
              return { success: true, message: 'Going to about page' };
            }
          } else {
            // Navigate to about page with section hash
            navigateTo(`about.html${aboutSection}`);
            return { success: true, message: `Going to ${target} on about page` };
          }
        }
        
        // Check if it's an index page section
        const section = NAVIGATION_MAP.sections[target];
        if (section) {
          if (context.isOnIndexPage) {
            // Already on index, just scroll
            navigateTo(section.target, true);
            return { success: true, message: `Going to ${target}` };
          } else {
            // Navigate to index page with section hash
            navigateTo(`index.html${section.target}`);
            return { success: true, message: `Going to ${target}` };
          }
        }
        
        // Fallback: route to projects section (most general destination)
        if (context.isOnIndexPage) {
          navigateTo('#projects', true);
        } else {
          navigateTo('index.html#projects');
        }
        return { success: true, message: 'Going to projects' };

      case 'navigate_page':
        const page = NAVIGATION_MAP.pages[target];
        if (page) {
          navigateTo(page.target);
          return { success: true, message: `Going to ${target} page` };
        }
        
        // Fallback: if page not found, try to route to about or projects based on context
        // If target sounds like "about" or personal, go to about
        if (target.toLowerCase().includes('about') || target.toLowerCase().includes('personal')) {
          navigateTo('about.html');
          return { success: true, message: 'Going to about page' };
        }
        
        // Otherwise, go to projects section
        if (context.isOnIndexPage) {
          navigateTo('#projects', true);
        } else {
          navigateTo('index.html#projects');
        }
        return { success: true, message: 'Going to projects' };

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
        
        // Try partial match (e.g., "oracle" matches "oracle-ai" or "oracle")
        if (!project) {
          const lowerTarget = target.toLowerCase();
          for (const key in NAVIGATION_MAP.projects) {
            if (key.toLowerCase().includes(lowerTarget) || lowerTarget.includes(key.toLowerCase())) {
              project = NAVIGATION_MAP.projects[key];
              break;
            }
          }
        }
        
        if (project) {
          navigateTo(project.target);
          return { success: true, message: `Opening ${target} project` };
        }
        
        // Fallback: route to projects section to show all projects
        if (context.isOnIndexPage) {
          navigateTo('#projects', true);
        } else {
          navigateTo('index.html#projects');
        }
        return { success: true, message: 'Going to projects' };

      case 'navigate_project_section':
        if (!context.isOnProjectPage) {
          // Fallback: if not on project page, try to navigate to overview section
          // First try to find a project that might match
          const currentPage = context.currentPage;
          if (currentPage.includes('oracle-ai')) {
            navigateTo('oracle-ai.html#overview');
          } else if (currentPage.includes('tidbit')) {
            navigateTo('tidbit.html#overview');
          } else if (currentPage.includes('tunein')) {
            navigateTo('tunein.html#overview');
          } else if (currentPage.includes('oracle')) {
            navigateTo('oracle.html#overview');
          } else {
            // Ultimate fallback: go to projects section
            if (context.isOnIndexPage) {
              navigateTo('#projects', true);
            } else {
              navigateTo('index.html#projects');
            }
          }
          return { success: true, message: 'Going to project overview' };
        }
        
        // Try exact match first
        let projectSection = NAVIGATION_MAP.projectSections[target];
        
        // Try with spaces replaced by hyphens
        if (!projectSection) {
          projectSection = NAVIGATION_MAP.projectSections[target.replace(/\s+/g, '-')];
        }
        
        // Try with hyphens replaced by spaces
        if (!projectSection) {
          projectSection = NAVIGATION_MAP.projectSections[target.replace(/-/g, ' ')];
        }
        
        // Try case-insensitive match
        if (!projectSection) {
          const lowerTarget = target.toLowerCase();
          for (const key in NAVIGATION_MAP.projectSections) {
            if (key.toLowerCase() === lowerTarget) {
              projectSection = NAVIGATION_MAP.projectSections[key];
              break;
            }
          }
        }
        
        // Try partial match (e.g., "design" matches "final-designs")
        if (!projectSection) {
          const lowerTarget = target.toLowerCase();
          for (const key in NAVIGATION_MAP.projectSections) {
            if (key.toLowerCase().includes(lowerTarget) || lowerTarget.includes(key.toLowerCase())) {
              projectSection = NAVIGATION_MAP.projectSections[key];
              break;
            }
          }
        }
        
        if (projectSection) {
          const scrolled = navigateTo(projectSection, true);
          if (scrolled) {
            return { success: true, message: `Going to ${target}` };
          }
        }
        
        // Fallback: route to overview section (always exists on project pages)
        const overviewScrolled = navigateTo('#overview', true);
        if (overviewScrolled) {
          return { success: true, message: 'Going to overview' };
        }
        
        // Ultimate fallback: scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return { success: true, message: 'Going to top of page' };

      case 'filter_projects':
        // Map the filter target to the actual chip category
        let filterChip = NAVIGATION_MAP.filterChips[target];
        
        // Try with spaces replaced by hyphens
        if (!filterChip) {
          filterChip = NAVIGATION_MAP.filterChips[target.replace(/\s+/g, '-')];
        }
        
        // Try with hyphens replaced by spaces
        if (!filterChip) {
          filterChip = NAVIGATION_MAP.filterChips[target.replace(/-/g, ' ')];
        }
        
        // Try case-insensitive match
        if (!filterChip) {
          const lowerTarget = target.toLowerCase();
          for (const key in NAVIGATION_MAP.filterChips) {
            if (key.toLowerCase() === lowerTarget) {
              filterChip = NAVIGATION_MAP.filterChips[key];
              break;
            }
          }
        }
        
        // Try partial match (e.g., "ai" matches "ai-design")
        if (!filterChip) {
          const lowerTarget = target.toLowerCase();
          for (const key in NAVIGATION_MAP.filterChips) {
            if (key.toLowerCase().includes(lowerTarget) || lowerTarget.includes(key.toLowerCase())) {
              filterChip = NAVIGATION_MAP.filterChips[key];
              break;
            }
          }
        }
        
        // Navigate to index page if not already there
        if (!context.isOnIndexPage) {
          navigateTo('index.html');
        }
        
        // Trigger the filter by clicking the appropriate chip button
        // Wait a bit for page to load if we just navigated
        setTimeout(() => {
          if (filterChip) {
            const chipButton = document.querySelector(`.voice-tag[data-category="${filterChip}"]`);
            if (chipButton) {
              chipButton.click();
              return;
            }
          }
          // Fallback: scroll to projects section
          navigateTo('#projects', true);
        }, context.isOnIndexPage ? 0 : 300);
        
        if (filterChip) {
          return { success: true, message: `Filtering projects by ${target}` };
        } else {
          // Fallback: just go to projects section
          if (context.isOnIndexPage) {
            navigateTo('#projects', true);
          } else {
            navigateTo('index.html#projects');
          }
          return { success: true, message: 'Going to projects' };
        }

      case 'unknown':
      default:
        // Always route somewhere - default to projects section
        if (context.isOnIndexPage) {
          navigateTo('#projects', true);
        } else {
          navigateTo('index.html#projects');
        }
        return { success: true, message: 'Going to projects' };
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
        isOnProjectPage: isOnProjectPage(),
        isOnAboutPage: isOnAboutPage()
      };

      // Interpret the command using OpenAI
      const interpretation = await interpretCommand(transcript, context);

      if (!interpretation.success) {
        console.error('Failed to interpret command:', interpretation.error);
        // Fallback: always route somewhere - default to projects section
        const fallbackInterpretation = {
          action: 'navigate_section',
          target: 'projects',
          confidence: 0.3
        };
        const result = executeNavigation(fallbackInterpretation, context);
        return result;
      }

      console.log('Interpreted command:', interpretation.data);

      // Execute the navigation
      const result = executeNavigation(interpretation.data, context);
      return result;
    } catch (error) {
      console.error('Unexpected error in voice navigation:', error);
      // Fallback: always route somewhere even on unexpected errors
      try {
        const context = {
          currentPage: getCurrentPage(),
          isOnIndexPage: isOnIndexPage(),
          isOnProjectPage: isOnProjectPage(),
          isOnAboutPage: isOnAboutPage()
        };
        const fallbackInterpretation = {
          action: 'navigate_section',
          target: 'projects',
          confidence: 0.2
        };
        const result = executeNavigation(fallbackInterpretation, context);
        return result;
      } catch (fallbackError) {
        // Ultimate fallback: just navigate to projects
        if (isOnIndexPage()) {
          navigateTo('#projects', true);
        } else {
          navigateTo('index.html#projects');
        }
        return {
          success: true,
          message: 'Going to projects'
        };
      }
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

