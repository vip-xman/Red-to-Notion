// Vercel API endpoint for OAuth token exchange
export default async function handler(req, res) {
  // Enable CORS for Chrome extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Notion OAuth credentials
    const CLIENT_ID = '25ed872b-594c-804a-baa6-0037917bc7e3';
    const CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET || 'secret_13SkRnZKWRmvKEbeuVhM2dw4417w9sJogteS9uEbMzZ';

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Notion token exchange error:', tokenData);
      return res.status(400).json({ 
        error: 'Token exchange failed', 
        details: tokenData 
      });
    }

    // Return tokens to the extension
    return res.status(200).json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      bot_id: tokenData.bot_id,
      workspace_name: tokenData.workspace_name,
      workspace_icon: tokenData.workspace_icon,
      workspace_id: tokenData.workspace_id,
      owner: tokenData.owner
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}