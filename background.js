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

// OAuth授权流程 - 使用手动窗口管理方式
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
    
    // 使用Chrome tabs API创建新标签页进行OAuth
    return new Promise((resolve, reject) => {
      // 创建新标签页
      chrome.tabs.create({
        url: authUrl.toString(),
        active: true
      }, (tab) => {
        const tabId = tab.id;
        console.log('📱 创建OAuth标签页:', tabId);
        
        // 监听标签页URL变化
        const updateListener = (updatedTabId, changeInfo, updatedTab) => {
          if (updatedTabId === tabId && changeInfo.url) {
            console.log('🔄 标签页URL变化:', changeInfo.url);

            // 检查是否是回调URL
            if (changeInfo.url.includes('red-to-notion.vercel.app/api/auth/callback')) {
              console.log('🔍 检测到可能的回调URL，验证参数...');

              try {
                // 解析URL参数，验证是否是真正的授权完成
                const url = new URL(changeInfo.url);
                const code = url.searchParams.get('code');
                const returnedState = url.searchParams.get('state');
                const error = url.searchParams.get('error');

                console.log('📋 URL参数检查 - code:', !!code, 'state:', !!returnedState, 'error:', error);

                // 如果有错误参数，立即处理
                if (error) {
                  console.error('❌ OAuth授权被拒绝:', error);
                  chrome.tabs.onUpdated.removeListener(updateListener);
                  chrome.tabs.onRemoved.removeListener(removeListener);
                  chrome.tabs.remove(tabId);
                  reject(new Error(`授权被拒绝: ${error}`));
                  return;
                }

                // 只有当确实有code参数时才处理（表示授权真正完成）
                if (code) {
                  console.log('✅ 确认收到授权码，准备处理...');

                  // 移除监听器
                  chrome.tabs.onUpdated.removeListener(updateListener);
                  chrome.tabs.onRemoved.removeListener(removeListener);

                  // 添加短暂延迟确保页面完全加载和处理完成
                  setTimeout(() => {
                    console.log('🔍 开始处理授权码 - code:', code, 'state:', returnedState);

                    // 关闭标签页
                    chrome.tabs.remove(tabId);

                    if (returnedState !== state) {
                      console.warn('⚠️ State验证失败，但继续执行 - 发送:', state, '接收:', returnedState);
                    }

                    // 继续token交换流程
                    handleTokenExchange(code, REDIRECT_URI).then(resolve).catch(reject);

                  }, 1500); // 增加延迟确保授权流程完全完成
                } else {
                  // 没有code参数，可能是中间重定向，继续监听
                  console.log('⏳ 未检测到授权码，继续监听...');
                }

              } catch (error) {
                console.error('❌ URL解析错误:', error);
                // URL解析失败，继续监听
              }
            }
          }
        };
        
        // 监听标签页关闭
        const removeListener = (removedTabId) => {
          if (removedTabId === tabId) {
            chrome.tabs.onUpdated.removeListener(updateListener);
            chrome.tabs.onRemoved.removeListener(removeListener);
            reject(new Error('OAuth窗口被用户关闭'));
          }
        };
        
        // 添加监听器
        chrome.tabs.onUpdated.addListener(updateListener);
        chrome.tabs.onRemoved.addListener(removeListener);
      });
    });
    
  } catch (error) {
    console.error('OAuth error:', error);
    return { success: false, error: error.message };
  }
}

// 独立的token交换函数
async function handleTokenExchange(code, redirectUri) {
  try {
    console.log('🔄 开始Token交换流程...');
    console.log('📝 请求参数:', { code: code.substring(0, 10) + '...', redirectUri });

    // 通过我们的API服务器交换token
    const tokenResponse = await fetch('https://red-to-notion.vercel.app/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code,
        redirect_uri: redirectUri
      })
    });

    console.log('📡 Token API响应状态:', tokenResponse.status, tokenResponse.statusText);

    const tokenData = await tokenResponse.json();
    console.log('📋 Token API响应数据:', {
      success: tokenResponse.ok,
      hasAccessToken: !!tokenData.access_token,
      hasWorkspace: !!tokenData.workspace_name,
      error: tokenData.error
    });

    if (!tokenResponse.ok) {
      const errorMsg = tokenData.error || tokenData.message || 'Token交换失败';
      console.error('❌ Token交换失败:', errorMsg, tokenData);
      throw new Error(`Token交换失败: ${errorMsg}`);
    }

    // 验证返回数据的完整性
    if (!tokenData.access_token) {
      console.error('❌ Token响应缺少access_token');
      throw new Error('服务器返回的Token数据不完整');
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

    console.log('💾 保存OAuth数据到storage:', {
      ...dataToSave,
      oauthToken: dataToSave.oauthToken.substring(0, 10) + '...' // 隐藏敏感信息
    });

    await chrome.storage.sync.set(dataToSave);

    // 验证数据是否保存成功
    const savedData = await chrome.storage.sync.get(['oauthToken', 'workspaceName', 'authMethod']);
    console.log('✅ 保存后验证数据:', {
      hasToken: !!savedData.oauthToken,
      workspaceName: savedData.workspaceName,
      authMethod: savedData.authMethod
    });

    // 双重验证：确保数据真的保存成功了
    if (!savedData.oauthToken || savedData.authMethod !== 'oauth') {
      console.error('❌ 数据保存验证失败:', savedData);
      throw new Error('OAuth数据保存失败，请重试');
    }

    console.log('🎉 OAuth授权流程完全成功！');
    return {
      success: true,
      workspace: {
        name: tokenData.workspace_name,
        icon: tokenData.workspace_icon,
        id: tokenData.workspace_id
      }
    };

  } catch (error) {
    console.error('💥 Token交换详细错误:', {
      message: error.message,
      stack: error.stack,
      code: code ? code.substring(0, 10) + '...' : 'undefined',
      redirectUri
    });
    throw error;
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