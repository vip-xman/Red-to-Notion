// OAuth callback endpoint for Notion authorization
export default async function handler(req, res) {
  // Enable CORS for Chrome extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;

    // If there's an error in authorization
    if (error) {
      return res.status(400).json({ 
        error: 'Authorization failed', 
        details: error 
      });
    }

    // If we have a code, this is a successful callback
    if (code) {
      // Return a simple HTML page that closes itself
      // The extension will capture this URL before the page loads
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Successful</title>
        </head>
        <body>
          <h2>Authorization successful!</h2>
          <p>You can close this window.</p>
          <script>
            // Try to close the window
            setTimeout(() => {
              window.close();
            }, 1000);
          </script>
        </body>
        </html>
      `);
    }

    // If no code or error, show generic success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Red To Notion</title>
      </head>
      <body>
        <h2>Red To Notion Authorization</h2>
        <p>Authorization endpoint</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}