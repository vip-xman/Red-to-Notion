chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clipToNotion') {
    handleClipToNotion(request.data, request.settings)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'notionOAuth') {
    handleNotionOAuth()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'getNotionPages') {
    getNotionPages(request.accessToken, request.query)
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

// OAuth授权流程
async function handleNotionOAuth() {
  try {
    const CLIENT_ID = '25ed872b-594c-804a-baa6-0037917bc7e3';
    const REDIRECT_URI = 'https://red-to-notion.vercel.app/api/auth/callback';
    
    // 生成随机state用于CSRF保护
    const state = generateRandomState();
    
    // 构建授权URL
    const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('owner', 'user');
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('state', state);
    
    console.log('🔗 OAuth授权URL:', authUrl.toString());
    console.log('🎯 重定向URI:', REDIRECT_URI);
    
    // 启动OAuth流程
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true
    });
    
    console.log('📥 OAuth返回URL:', responseUrl);
    
    // 解析返回的URL - responseUrl应该是回调URL
    const urlParams = new URL(responseUrl);
    const code = urlParams.searchParams.get('code');
    const returnedState = urlParams.searchParams.get('state');
    
    console.log('🔍 解析参数 - code:', code, 'state:', returnedState);
    
    if (!code) {
      throw new Error('授权失败：未获取到授权码');
    }
    
    if (returnedState !== state) {
      throw new Error('授权失败：状态验证失败');
    }
    
    // 通过我们的API服务器交换token
    const tokenResponse = await fetch('https://red-to-notion.vercel.app/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Token交换失败');
    }
    
    // 保存OAuth信息到storage
    const dataToSave = {
      oauthToken: tokenData.access_token,
      workspaceName: tokenData.workspace_name,
      workspaceIcon: tokenData.workspace_icon,
      workspaceId: tokenData.workspace_id,
      botId: tokenData.bot_id,
      authMethod: 'oauth'
    };
    
    console.log('💾 保存OAuth数据到storage:', dataToSave);
    await chrome.storage.sync.set(dataToSave);
    
    // 验证数据是否保存成功
    const savedData = await chrome.storage.sync.get(['oauthToken', 'workspaceName', 'authMethod']);
    console.log('✅ 保存后验证数据:', savedData);
    
    return {
      success: true,
      workspace: {
        name: tokenData.workspace_name,
        icon: tokenData.workspace_icon,
        id: tokenData.workspace_id
      }
    };
    
  } catch (error) {
    console.error('OAuth error:', error);
    return { success: false, error: error.message };
  }
}

// 获取用户的Notion页面列表
async function getNotionPages(accessToken, query = '') {
  try {
    const response = await fetch('https://red-to-notion.vercel.app/api/notion/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_token: accessToken,
        query: query,
        page_size: 50
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '获取页面列表失败');
    }
    
    return {
      success: true,
      pages: data.pages,
      hasMore: data.has_more
    };
    
  } catch (error) {
    console.error('Get pages error:', error);
    return { success: false, error: error.message };
  }
}

// 生成随机状态字符串
function generateRandomState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}