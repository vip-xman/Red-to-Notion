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
      // For Chrome Extension OAuth flow, we need the page to be accessible
      // chrome.identity.launchWebAuthFlow will capture this URL automatically
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Successful</title>
          <meta charset="utf-8">
          <script>
            console.log('OAuth callback page loaded with code: ${code}');
            console.log('Current URL: ' + window.location.href);
            
            // For chrome.identity.launchWebAuthFlow, we don't need to do anything special
            // The extension will capture this URL automatically
            // Just show success message and wait for the window to be closed by the extension
            
            setTimeout(() => {
              console.log('Attempting to close window');
              if (window.close) {
                window.close();
              }
            }, 1000);
          </script>
        </head>
        <body>
          <h2>✅ Authorization successful!</h2>
          <p>🔄 Redirecting back to extension...</p>
          <p>If this window doesn't close automatically, you can close it manually.</p>
          <script>
            // Make sure the URL params are visible in the current page
            document.body.innerHTML += '<p style="font-size:12px;color:#666;">Code: ${code}</p>';
            document.body.innerHTML += '<p style="font-size:12px;color:#666;">State: ${state || 'none'}</p>';
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