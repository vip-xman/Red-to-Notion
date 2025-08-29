// Vercel API endpoint for fetching user's Notion pages
export default async function handler(req, res) {
  // Enable CORS for Chrome extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { access_token, query = '', page_size = 50 } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Search for pages using Notion API
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        query: query,
        filter: {
          value: 'page',
          property: 'object'
        },
        page_size: page_size,
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        }
      })
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Notion search error:', searchData);
      return res.status(searchResponse.status).json({ 
        error: 'Failed to fetch pages', 
        details: searchData 
      });
    }

    // Process and format page data
    const pages = searchData.results.map(page => {
      let title = 'Untitled';
      
      // Extract page title
      if (page.properties && page.properties.title && page.properties.title.title) {
        const titleText = page.properties.title.title
          .map(t => t.plain_text)
          .join('');
        if (titleText) title = titleText;
      }

      // Get page icon
      let icon = null;
      if (page.icon) {
        if (page.icon.type === 'emoji') {
          icon = page.icon.emoji;
        } else if (page.icon.type === 'external') {
          icon = page.icon.external.url;
        } else if (page.icon.type === 'file') {
          icon = page.icon.file.url;
        }
      }

      return {
        id: page.id,
        title: title,
        icon: icon,
        url: page.url,
        last_edited_time: page.last_edited_time,
        created_time: page.created_time
      };
    });

    return res.status(200).json({
      pages: pages,
      has_more: searchData.has_more,
      next_cursor: searchData.next_cursor
    });

  } catch (error) {
    console.error('Pages fetch error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}