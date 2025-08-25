chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clipToNotion') {
    handleClipToNotion(request.data, request.settings)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleClipToNotion(data, settings) {
  try {
    
    // 创建要添加到页面的内容块
    const contentBlocks = [];
    
    // 添加标题
    if (data.title) {
      contentBlocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              text: {
                content: data.title
              }
            }
          ]
        }
      });
    }
    
    // 添加原文链接
    if (data.url) {
      contentBlocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content: '原文链接：'
              }
            },
            {
              text: {
                content: data.url,
                link: {
                  url: data.url
                }
              }
            }
          ]
        }
      });
    }
    
    // 添加内容
    if (data.content) {
      contentBlocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content: data.content
              }
            }
          ]
        }
      });
    }
    
    // 添加标签
    if (data.tags && data.tags.length > 0) {
      contentBlocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content: '标签：' + data.tags.map(tag => '#' + tag).join(' ')
              }
            }
          ]
        }
      });
    }
    
    // 添加图片链接
    if (data.images && data.images.length > 0) {
      contentBlocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [
            {
              text: {
                content: '图片链接：'
              }
            }
          ]
        }
      });
      
      data.images.forEach((imageUrl, index) => {
        contentBlocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content: `图片 ${index + 1}：`,
                }
              },
              {
                text: {
                  content: imageUrl,
                  link: {
                    url: imageUrl
                  }
                }
              }
            ]
          }
        });
      });
    }
    
    // 添加分隔线
    contentBlocks.push({
      object: 'block',
      type: 'divider',
      divider: {}
    });

    // 使用页面ID而非数据库ID，将内容添加到指定页面
    const response = await fetch(`https://api.notion.com/v1/blocks/${settings.pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${settings.notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        children: contentBlocks
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return { success: true, pageId: settings.pageId };

  } catch (error) {
    console.error('Clip to Notion error:', error);
    return { success: false, error: error.message };
  }
}