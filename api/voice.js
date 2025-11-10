/**
 * Vercel Serverless Function for Voice Navigation
 * ------------------------------------------------
 * This function handles OpenAI API calls server-side to keep the API key secure.
 * It receives the system prompt and user transcript, makes the OpenAI call,
 * and returns the response.
 */

export default async function handler(req, res) {
  // Basic CORS for local dev/production
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, transcript } = req.body || {};

    if (!systemPrompt || !transcript) {
      return res.status(400).json({ error: 'Missing systemPrompt or transcript' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not set in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

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
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `OpenAI API error: ${response.status}`,
        details: errorText 
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    // CORS for browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ 
      reply: content,
      fullResponse: data 
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
}

