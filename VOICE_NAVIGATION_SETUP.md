# Voice Navigation Setup Guide

This portfolio website includes voice-controlled navigation powered by OpenAI's GPT-4o-mini API. Users can navigate between pages and sections using natural language commands.

## Quick Start

### Prerequisites
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- Modern web browser with speech recognition support (Chrome, Edge, Safari)

### Installation

1. **Create .env file**
   
   Create a `.env` file in the root directory of your project:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```
   
   Replace `your-api-key-here` with your actual OpenAI API key.

2. **Verify .gitignore**
   
   The `.env` file is already included in `.gitignore` to prevent accidentally committing your API key.

3. **Test the installation**
   
   Open `index.html` in your browser and:
   - Click the microphone button (main button on landing page, navbar button, or side menu button on project pages)
   - Allow microphone access when prompted
   - Try saying: "show me naima's work" or "go to projects"

## How It Works

### Voice Commands

The system understands natural language. Here are some example commands:

#### Navigation to Sections
- "show me work" / "view projects" / "see portfolio" → Navigates to projects section
- "go to about" / "show me about" → Navigates to about section
- "show resume" / "open resume" → Navigates to resume section

#### Navigation to Projects
- "open oracle AI" / "show oracle ai project" → Opens Oracle AI project page
- "go to tidbit" / "show tidbit project" → Opens Tidbit project page
- "open tunein" / "show tunein" → Opens TuneIn project page
- "go to oracle" → Opens Oracle project page

#### Navigation Within Project Pages
- "go to final designs" → Scrolls to final designs section
- "show me research" → Scrolls to research section
- "go to overview" → Scrolls to overview section
- "show takeaways" / "go to conclusions" → Scrolls to takeaways section

#### General Navigation
- "go home" / "take me to landing" → Returns to homepage

### Technical Architecture

1. **env-loader.js** - Loads environment variables from `.env` file (development only)
2. **voice-navigation.js** - Handles OpenAI API calls and command interpretation
3. **voice-button.js** - Manages speech recognition and UI updates

The system uses:
- Web Speech API for voice capture
- OpenAI GPT-4o-mini for natural language understanding
- Smooth scroll and page navigation for actions

## Production Deployment

⚠️ **Important:** The current setup uses client-side API calls with the key loaded from `.env`. This is suitable for **development only**.

For production deployment, you should:

1. Set up a backend proxy server to handle OpenAI API calls
2. Store the API key securely on the server
3. Update `voice-navigation.js` to call your backend instead of OpenAI directly

Example backend endpoint:
```javascript
// Instead of calling OpenAI directly:
fetch('https://api.openai.com/v1/chat/completions', ...)

// Call your backend:
fetch('/api/voice-navigation', {
  method: 'POST',
  body: JSON.stringify({ transcript, currentPage })
})
```

## Browser Compatibility

Voice navigation requires:
- **Speech Recognition API**: Chrome, Edge, Safari (iOS 14.5+)
- **Microphone access**: User must grant permission

Unsupported browsers will see a "Voice control unavailable" message.

## Troubleshooting

### Voice button shows "Voice control unavailable"
- Your browser doesn't support the Web Speech API
- Try using Chrome, Edge, or Safari

### Commands aren't being recognized
- Check browser console for errors
- Verify `.env` file exists with correct API key
- Ensure microphone permissions are granted
- Check your OpenAI API key is valid and has credits

### API errors
- Verify your OpenAI API key is active
- Check you have available credits in your OpenAI account
- Look at browser console for specific error messages

## Cost Estimate

Using GPT-4o-mini:
- Cost: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average voice command: ~150 tokens total
- Cost per command: ~$0.0001 (essentially free for personal use)

## Support

For issues or questions:
- Check browser console for error messages
- Verify all setup steps were completed
- Ensure `.env` file is in the root directory
- Test with simple commands first ("go to projects")

test