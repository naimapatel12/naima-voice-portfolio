// /assets/js/voice-nav.js

function normalize(u='') {
  return u.toLowerCase().replace(/[^\w\s-]/g,' ').replace(/\s+/g,' ').trim();
}

const FILTER_STORAGE_KEY = '__VOICE_PENDING_FILTER__';

/**
 * NAVIGATION MAP
 * - page: target HTML file
 * - hash: in-page anchor (optional)
 */
const NAVIGATION_MAP = {
  // Landing & main sections on index
  sections: {
    landing:  { page: 'index.html', hash: '#landing' },
    projects: { page: 'index.html', hash: '#projects' },
    resume:   { page: './assets/Resume.pdf', external: true },
    home:     { page: 'index.html', hash: '#landing' },
  },

  // Top-level pages
  pages: {
    about: { page: 'about.html', hash: '' },
  },

  // About page sections
  aboutSections: {
    'about::interests-hobbies': { page: 'about.html', hash: '#interests-hobbies' },
    'about::why-voice':         { page: 'about.html', hash: '#why-voice' },
    'about::my-art':            { page: 'about.html', hash: '#my-art' },
    'about::music-experience':  { page: 'about.html', hash: '#music-experience' },
  },

  // Project pages (top)
  projectPages: {
    oracle:       { page: 'oracle.html' },
    'oracle-ai':  { page: 'oracle-ai.html' },
    tunein:       { page: 'tunein.html' },
    tidbit:       { page: 'tidbit.html' },
  },

  // Common project sections (add more as needed)
  projectSections: {
    'oracle::final-designs':      { page: 'oracle.html',     hash: '#final-designs' },
    'oracle-ai::final-designs':   { page: 'oracle-ai.html',  hash: '#final-designs' },
    'tunein::final-designs':      { page: 'tunein.html',     hash: '#final-designs' },
    'tidbit::final-designs':      { page: 'tidbit.html',     hash: '#final-designs' },
  },

  // Project filters (landing chip filters)
  filters: {
    mobile:     { filter: 'mobile' },
    web:        { filter: 'web' },
    consumer:   { filter: 'consumer' },
    ai:         { filter: 'ai' },
    enterprise: { filter: 'enterprise' },
  },
};

/**
 * KEYWORDS / SYNONYMS with weights
 * - Each candidate has an array of tokens {phrase, weight}
 * - We score by sum of weights for phrases found via .includes()
 * - Add boosts for [project + section] combos
 */
const KEYWORDS = {
  // index sections
  landing:  [{phrase:'home',weight:3},{phrase:'landing',weight:3},{phrase:'start',weight:2},{phrase:'top',weight:2},{phrase:'welcome',weight:2}],
  projects: [{phrase:'projects',weight:3},{phrase:'project',weight:2},{phrase:'work',weight:2},{phrase:'portfolio',weight:2},{phrase:'see my work',weight:3},{phrase:'view my work',weight:3}],
  resume:   [{phrase:'resume',weight:4},{phrase:'cv',weight:3},{phrase:'curriculum vitae',weight:3},{phrase:'experience',weight:2}],
  about:    [{phrase:'about',weight:3},{phrase:'about me',weight:3},{phrase:'bio',weight:2}],

  // about sections
  'about::interests-hobbies': [
    {phrase:'interests',weight:4},
    {phrase:'hobbies',weight:4},
    {phrase:'sports',weight:5},
    {phrase:'does naima play',weight:5},
    {phrase:'what does naima do for fun',weight:5},
    {phrase:'outside of work',weight:3}
  ],
  'about::why-voice':  [{phrase:'why voice',weight:5},{phrase:'voice rationale',weight:3},{phrase:'voice design',weight:3}],
  'about::my-art':     [{phrase:'art',weight:3},{phrase:'my art',weight:4},{phrase:'artwork',weight:3}],
  'about::music-experience': [{phrase:'music',weight:3},{phrase:'music experience',weight:4}],

  // projects (tops)
  oracle:      [{phrase:'oracle',weight:4}],
  'oracle-ai': [{phrase:'oracle ai',weight:5},{phrase:'oracle-ai',weight:5}],
  tunein:      [{phrase:'tunein',weight:5},{phrase:'tune in',weight:4}],
  tidbit:      [
    {phrase:'tidbit',weight:5},
    {phrase:'tid bit',weight:4},
    {phrase:"naima's best project",weight:7},
    {phrase:'best project',weight:6},
    {phrase:'favorite project',weight:6},
    {phrase:"naima's favorite project",weight:7}
  ],

  // common project section keywords
  '::final-designs': [{phrase:'final designs',weight:6},{phrase:'final deliverables',weight:5},{phrase:'final design',weight:5},{phrase:'finals',weight:3}],

  // project filter keywords
  mobile: [
    {phrase:'mobile design',weight:5},
    {phrase:'mobile projects',weight:5},
    {phrase:'mobile work',weight:4},
    {phrase:'mobile portfolio',weight:4},
    {phrase:'mobile',weight:2}
  ],
  web: [
    {phrase:'web design',weight:5},
    {phrase:'web projects',weight:5},
    {phrase:'web work',weight:4},
    {phrase:'website design',weight:4},
    {phrase:'website projects',weight:4}
  ],
  consumer: [
    {phrase:'consumer projects',weight:6},
    {phrase:'consumer product',weight:5},
    {phrase:'consumer work',weight:4},
    {phrase:'consumer portfolio',weight:4}
  ],
  ai: [
    {phrase:'ai design',weight:6},
    {phrase:'ai projects',weight:6},
    {phrase:'ai interaction',weight:5},
    {phrase:'artificial intelligence',weight:5},
    {phrase:'ai portfolio',weight:5}
  ],
  enterprise: [
    {phrase:'enterprise design',weight:6},
    {phrase:'enterprise projects',weight:6},
    {phrase:'enterprise work',weight:5},
    {phrase:'enterprise portfolio',weight:5}
  ],
};

// Canonical list of candidates to score (order doesn't matter; scoring picks best)
const CANDIDATES = [
  // index sections
  {group:'sections', key:'landing'},
  {group:'sections', key:'projects'},
  {group:'sections', key:'resume'},

  // about page + sections
  {group:'pages', key:'about'},
  {group:'aboutSections', key:'about::interests-hobbies'},
  {group:'aboutSections', key:'about::why-voice'},
  {group:'aboutSections', key:'about::my-art'},
  {group:'aboutSections', key:'about::music-experience'},

  // project pages (tops)
  {group:'projectPages', key:'oracle'},
  {group:'projectPages', key:'oracle-ai'},
  {group:'projectPages', key:'tunein'},
  {group:'projectPages', key:'tidbit'},

  // common project "final-designs" deep links
  {group:'projectSections', key:'oracle::final-designs'},
  {group:'projectSections', key:'oracle-ai::final-designs'},
  {group:'projectSections', key:'tunein::final-designs'},
  {group:'projectSections', key:'tidbit::final-designs'},

  // project filters
  {group:'filters', key:'mobile'},
  {group:'filters', key:'web'},
  {group:'filters', key:'consumer'},
  {group:'filters', key:'ai'},
  {group:'filters', key:'enterprise'},
];

// Utility: return sum of keyword weights matched in text
function scoreForKey(text, key) {
  const arr = KEYWORDS[key] || [];
  let s = 0;
  for (const {phrase, weight} of arr) {
    if (text.includes(phrase)) s += weight;
  }
  return s;
}

// Special combined scoring for [project + common section] combos
function comboBoost(text, project) {
  const projectScore = scoreForKey(text, project);
  const sectionScore = scoreForKey(text, '::final-designs');
  return (projectScore > 0 && sectionScore > 0) ? projectScore + sectionScore + 2 /*bonus*/ : 0;
}

function scoreIntent(utterance) {
  const text = normalize(utterance);

  // Precompute helpful flags
  const finalDesigns = scoreForKey(text, '::final-designs');

  let best = { group:'sections', key:'landing', score: -Infinity }; // default fallback
  for (const c of CANDIDATES) {
    let s = 0;

    // Base score from direct keywords
    s += scoreForKey(text, c.key);

    // If candidate is a top-level project and user asked for final designs, consider mapping to its final-designs section
    if (c.group === 'projectPages' && finalDesigns > 0) {
      s += comboBoost(text, c.key);
    }

    // Light heuristic boosts
    if (c.key === 'about::interests-hobbies' && (text.includes('sports') || text.includes('play'))) s += 2;
    if (c.key === 'resume' && text.includes('hire')) s += 1;
    if (c.key === 'projects' && text.includes('portfolio')) s += 1;
    if (c.group === 'filters' && text.includes('project')) s += 1;

    // Track best
    if (s > best.score) best = { ...c, score: s };
  }

  // If best is a top-level project but user also indicated final designs, remap to the specific final-designs section
  if (finalDesigns > 0 && best.group === 'projectPages') {
    const secKey = `${best.key}::final-designs`;
    if (NAVIGATION_MAP.projectSections[secKey]) {
      return { group:'projectSections', key: secKey, score: best.score + 1 };
    }
  }

  // If still nothing scored, best will remain default landing due to -Infinity init
  if (!best || best.score === -Infinity) {
    return { group:'sections', key:'landing', score: 0 };
  }
  return best;
}

function isIndexPage() {
  const path = window.location.pathname;
  const file = path.split('/').pop() || '';
  return file === '' || file === 'index.html';
}

function queueFilter(category) {
  if (!category) return;
  try {
    sessionStorage.setItem(FILTER_STORAGE_KEY, category);
  } catch (_) {}
}

function consumeQueuedFilter() {
  try {
    const value = sessionStorage.getItem(FILTER_STORAGE_KEY);
    if (value) {
      sessionStorage.removeItem(FILTER_STORAGE_KEY);
      return value;
    }
  } catch (_) {}
  return null;
}

function applyFilter(category) {
  if (!category) return;

  const execute = () => {
    const tagButton = document.querySelector(`.voice-tag[data-category="${category}"]`);
    const projectsSection = document.querySelector('#projects');
    if (tagButton) {
      if (!tagButton.classList.contains('active')) {
        tagButton.click();
      }
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth' });
      }
      return true;
    }
    return false;
  };

  if (isIndexPage()) {
    if (!execute()) {
      const retryStart = Date.now();
      const retry = setInterval(() => {
        if (execute() || Date.now() - retryStart > 2000) {
          clearInterval(retry);
        }
      }, 100);
    }
  } else {
    queueFilter(category);
    window.location.href = 'index.html#projects';
  }
}

function navigateTo(target) {
  if (!target) return;

  if (target.filter) {
    applyFilter(target.filter);
    return;
  }

  const { page = 'index.html', hash = '' } = target;
  const normalizedPage = (page || '').replace(/^\.\//, '');
  const destination = `${page || ''}${hash || ''}`;

  const isPdf = /\.pdf($|\?)/i.test(normalizedPage);
  if (target.external || isPdf) {
    const url = destination || './assets/Resume.pdf';
    window.open(url, '_blank', 'noopener');
    return;
  }

  const pathParts = window.location.pathname.split('/');
  const currentFile = pathParts.pop() || '';
  const onSamePage =
    normalizedPage === '' ||
    currentFile === normalizedPage ||
    (normalizedPage === 'index.html' && (currentFile === '' || currentFile === 'index.html'));

  if (onSamePage) {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.location.hash = hash;
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else {
    window.location.href = destination || 'index.html';
  }
}

function handleVoiceCommand(utterance) {
  const best = scoreIntent(utterance);
  const groupMap = NAVIGATION_MAP[best.group] || {};
  const target = groupMap[best.key];

  // Always choose something; never error.
  if (target) {
    navigateTo(target);
    return;
  }

  // If somehow not found, hard fallback to landing (still never error)
  navigateTo(NAVIGATION_MAP.sections.landing);
}

// Expose on window for global access
window.handleVoiceCommand = handleVoiceCommand;

document.addEventListener('DOMContentLoaded', () => {
  const pendingFilter = consumeQueuedFilter();
  if (pendingFilter) {
    applyFilter(pendingFilter);
  }
});

