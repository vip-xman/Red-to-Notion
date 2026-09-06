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
  
  if (request.action === 'getWorkspaceTree') {
    getWorkspaceTree(request.accessToken)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

});

async function handleClipToNotion(data, settings) {
  try {
    const targetType = settings.targetType || 'page';

    // includeTitleHeading: 数据库模式下标题已经是记录自身的title属性，正文里不用重复展示
    const { blocks: contentBlocks } = await buildContentBlocks(data, settings.notionToken, {
      includeTitleHeading: targetType !== 'database'
    });

    if (targetType === 'database') {
      // 每个数据库有且仅有一个title类型属性，具体名字因库而异，需先读一次schema找到它
      const titlePropertyName = await getDatabaseTitlePropertyName(settings.notionToken, settings.targetId);

      const properties = {
        [titlePropertyName]: {
          title: [
            {
              text: { content: data.title || '未命名笔记' }
            }
          ]
        }
      };

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: settings.targetId },
          properties: properties,
          children: contentBlocks
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: true, pageId: result.id, pageUrl: result.url };
    }

    // 页面模式：将内容追加到指定页面
    contentBlocks.push({
      object: 'block',
      type: 'divider',
      divider: {}
    });

    const response = await fetch(`https://api.notion.com/v1/blocks/${settings.targetId}/children`, {
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

    await response.json();
    return { success: true, pageId: settings.targetId };

  } catch (error) {
    console.error('Clip to Notion error:', error);
    return { success: false, error: error.message };
  }
}

// 构建剪藏内容对应的Notion block数组；返回blocks和图片上传结果（供数据库封面属性复用）
async function buildContentBlocks(data, notionToken, { includeTitleHeading }) {
  const blocks = [];

  if (includeTitleHeading && data.title) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            text: { content: data.title }
          }
        ]
      }
    });
  }

  if (data.url) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            text: { content: '原文链接：' }
          },
          {
            text: {
              content: data.url,
              link: { url: data.url }
            }
          }
        ]
      }
    });
  }

  if (data.content) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            text: { content: data.content }
          }
        ]
      }
    });
  }

  if (data.tags && data.tags.length > 0) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            text: { content: '标签：' + data.tags.map(tag => '#' + tag).join(' ') }
          }
        ]
      }
    });
  }

  if (data.images && data.images.length > 0) {
    for (let index = 0; index < data.images.length; index++) {
      const imageUrl = data.images[index];
      const fileUploadId = await uploadImageToNotion(imageUrl, notionToken, index);

      if (fileUploadId) {
        blocks.push({
          object: 'block',
          type: 'image',
          image: {
            type: 'file_upload',
            file_upload: {
              id: fileUploadId
            }
          }
        });
      } else {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: { content: `图片 ${index + 1}（上传失败，保留链接）：` }
              },
              {
                text: {
                  content: imageUrl,
                  link: { url: imageUrl }
                }
              }
            ]
          }
        });
      }
    }
  }

  return { blocks };
}

// 读取数据库schema，返回其唯一的title类型属性名（每个数据库有且仅有一个）
async function getDatabaseTitlePropertyName(accessToken, databaseId) {
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28'
    }
  });

  const database = await response.json();

  if (!response.ok) {
    throw new Error(database.message || `读取数据库失败 HTTP ${response.status}`);
  }

  const titleEntry = Object.entries(database.properties || {}).find(([, def]) => def.type === 'title');

  if (!titleEntry) {
    throw new Error('该数据库缺少标题属性');
  }

  return titleEntry[0];
}

// 下载小红书图片并通过Notion File Upload API上传，返回file_upload id；失败返回null
async function uploadImageToNotion(imageUrl, notionToken, index) {
  try {
    // Referer属于禁止头，无法通过headers设置，需用fetch的referrer选项
    const imageResponse = await fetch(imageUrl, {
      referrer: 'https://www.xiaohongshu.com/'
    });

    if (!imageResponse.ok) {
      throw new Error(`下载图片失败 HTTP ${imageResponse.status}`);
    }

    const blob = await imageResponse.blob();
    const contentType = blob.type || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';
    const filename = `image-${index + 1}.${extension}`;

    // 1. 创建file upload
    const createResponse = await fetch('https://api.notion.com/v1/file_uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filename: filename,
        content_type: contentType
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.message || `创建file upload失败 HTTP ${createResponse.status}`);
    }

    const fileUpload = await createResponse.json();

    // 2. 发送文件内容
    const formData = new FormData();
    formData.append('file', blob, filename);

    const sendResponse = await fetch(fileUpload.upload_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28'
      },
      body: formData
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.json();
      throw new Error(error.message || `上传文件内容失败 HTTP ${sendResponse.status}`);
    }

    return fileUpload.id;

  } catch (error) {
    console.error(`图片 ${index + 1} 上传到Notion失败，将退回为文本链接:`, error);
    return null;
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

                  // 立即处理：MV3 Service Worker 可能在 setTimeout 等待期间被系统回收，
                  // 之前用 setTimeout 延迟处理会导致回调永远不执行，
                  // 而回调页面自身的倒计时仍会照常关闭标签页，造成"页面显示成功但插件未登录"
                  console.log('🔍 开始处理授权码 - code:', code, 'state:', returnedState);

                  // 关闭标签页
                  chrome.tabs.remove(tabId);

                  if (returnedState !== state) {
                    console.warn('⚠️ State验证失败，但继续执行 - 发送:', state, '接收:', returnedState);
                  }

                  // 继续token交换流程
                  handleTokenExchange(code, REDIRECT_URI).then(resolve).catch(reject);
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

    await chrome.storage.local.set(dataToSave);

    // 验证数据是否保存成功
    const savedData = await chrome.storage.local.get(['oauthToken', 'workspaceName', 'authMethod']);
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


// 获取当前integration被授权访问的全部页面和数据库（不区分类型，带parent信息用于客户端拼层级树）
// 数据库行页面（parent是database_id）会被排除，只保留可作为组织结构的页面/数据库节点
async function getWorkspaceTree(accessToken) {
  try {
    const items = [];
    let cursor = undefined;
    const MAX_PAGES = 5; // 最多翻5页，每页100条，共500条，避免超大工作区导致请求过慢

    for (let i = 0; i < MAX_PAGES; i++) {
      const response = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          page_size: 100,
          start_cursor: cursor,
          sort: { direction: 'descending', timestamp: 'last_edited_time' }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `获取工作区结构失败 HTTP ${response.status}`);
      }

      items.push(...data.results);

      if (!data.has_more || !data.next_cursor) break;
      cursor = data.next_cursor;
    }

    const nodes = items
      .filter(item => item.parent?.type !== 'database_id') // 排除数据库里的行页面，只保留组织结构节点
      .map(item => {
        const isDatabase = item.object === 'database';
        const title = extractItemTitle(item, isDatabase);

        let icon = null;
        if (item.icon) {
          icon = item.icon.type === 'emoji' ? item.icon.emoji : (item.icon.external?.url || item.icon.file?.url || null);
        }

        return {
          id: item.id,
          type: isDatabase ? 'database' : 'page',
          title: title,
          icon: icon,
          url: item.url,
          parentType: item.parent?.type || 'workspace',
          parentId: item.parent?.page_id || item.parent?.database_id || item.parent?.block_id || null
        };
      });

    return { success: true, nodes };

  } catch (error) {
    console.error('Get workspace tree error:', error);
    return { success: false, error: error.message };
  }
}

// 提取page/database对象的标题：普通页面的标题属性固定叫title；数据库对象标题是顶层title数组
function extractItemTitle(item, isDatabase) {
  if (isDatabase) {
    return (item.title || []).map(t => t.plain_text).join('') || '未命名数据库';
  }

  const properties = item.properties || {};
  if (properties.title?.title) {
    return properties.title.title.map(t => t.plain_text).join('') || '未命名页面';
  }

  // 极少数情况下（比如页面本身是数据库的行）title属性可能用别的名字，兜底扫描
  const titleProp = Object.values(properties).find(p => p.type === 'title');
  if (titleProp?.title) {
    return titleProp.title.map(t => t.plain_text).join('') || '未命名页面';
  }

  return '未命名页面';
}

// 生成随机状态字符串
function generateRandomState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}