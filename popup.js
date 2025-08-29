document.addEventListener('DOMContentLoaded', function() {
  // DOM 元素引用
  const clipBtn = document.getElementById('clipBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const saveBtn = document.getElementById('saveBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const status = document.getElementById('status');
  const preview = document.getElementById('preview');
  
  // OAuth 相关元素
  const oauthBtn = document.getElementById('oauthBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const notLoggedIn = document.getElementById('notLoggedIn');
  const loggedIn = document.getElementById('loggedIn');
  const workspaceName = document.getElementById('workspaceName');
  const workspaceIcon = document.getElementById('workspaceIcon');
  
  // 页面选择器相关元素
  const pageSelector = document.getElementById('pageSelector');
  const selectedPage = document.getElementById('selectedPage');
  const selectedPageIcon = document.getElementById('selectedPageIcon');
  const selectedPageTitle = document.getElementById('selectedPageTitle');
  
  // 抽屉相关元素
  const pageDrawer = document.getElementById('pageDrawer');
  const closeDrawer = document.getElementById('closeDrawer');
  const pageSearchInput = document.getElementById('pageSearchInput');
  const pageList = document.getElementById('pageList');
  const loadingPages = document.getElementById('loadingPages');
  const emptyPages = document.getElementById('emptyPages');
  
  let currentPageData = null;
  let currentSettings = {};
  let availablePages = [];
  let selectedPageData = null;

  // 初始化
  init();

  async function init() {
    await checkAuthStatus();
    await loadSettings();
    checkCurrentPage();
    bindEvents();
  }

  function bindEvents() {
    clipBtn.addEventListener('click', clipToNotion);
    settingsBtn.addEventListener('click', toggleSettings);
    saveBtn.addEventListener('click', saveSettings);
    
    // OAuth 事件
    oauthBtn.addEventListener('click', handleOAuthLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // 页面选择器事件
    selectedPage.addEventListener('click', openPageSelector);
    closeDrawer.addEventListener('click', closePageSelector);
    pageDrawer.addEventListener('click', (e) => {
      if (e.target === pageDrawer) closePageSelector();
    });
    
    // 搜索事件
    pageSearchInput.addEventListener('input', debounce(handlePageSearch, 300));
  }

  // 检查认证状态
  async function checkAuthStatus() {
    const result = await chrome.storage.sync.get(['oauthToken', 'workspaceName', 'workspaceIcon', 'authMethod']);
    
    if (result.oauthToken && result.authMethod === 'oauth') {
      // 已通过OAuth登录
      showLoggedInState(result);
      await loadSelectedPage();
    } else {
      // 未登录或使用手动配置
      showLoggedOutState();
    }
  }

  function showLoggedInState(data) {
    notLoggedIn.style.display = 'none';
    loggedIn.style.display = 'flex';
    pageSelector.style.display = 'block';
    
    workspaceName.textContent = data.workspaceName || 'Notion Workspace';
    if (data.workspaceIcon) {
      workspaceIcon.src = data.workspaceIcon;
      workspaceIcon.style.display = 'block';
    } else {
      workspaceIcon.style.display = 'none';
    }
    
    currentSettings.authMethod = 'oauth';
    currentSettings.oauthToken = data.oauthToken;
  }

  function showLoggedOutState() {
    notLoggedIn.style.display = 'block';
    loggedIn.style.display = 'none';
    pageSelector.style.display = 'none';
    
    currentSettings.authMethod = 'manual';
  }

  // OAuth 登录处理
  async function handleOAuthLogin() {
    oauthBtn.disabled = true;
    oauthBtn.textContent = '🔄 正在授权...';
    updateStatus('正在跳转到Notion授权页面...', 'info');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'notionOAuth' });
      
      if (response.success) {
        updateStatus('授权成功！', 'success');
        await checkAuthStatus();
        updateStatus('正在加载页面列表...', 'info');
        await loadPages();
      } else {
        updateStatus('授权失败: ' + response.error, 'error');
      }
    } catch (error) {
      updateStatus('授权失败: ' + error.message, 'error');
    }

    oauthBtn.disabled = false;
    oauthBtn.textContent = '🚀 一键登录 Notion';
  }

  // 退出登录
  async function handleLogout() {
    await chrome.storage.sync.remove(['oauthToken', 'workspaceName', 'workspaceIcon', 'workspaceId', 'botId', 'selectedPageId', 'selectedPageTitle', 'selectedPageIcon']);
    showLoggedOutState();
    selectedPageData = null;
    updateStatus('已退出登录', 'info');
  }

  // 打开页面选择器
  async function openPageSelector() {
    pageDrawer.style.display = 'block';
    setTimeout(() => pageDrawer.classList.add('show'), 10);
    
    if (availablePages.length === 0) {
      await loadPages();
    } else {
      showPageList();
    }
    
    pageSearchInput.focus();
  }

  // 关闭页面选择器
  function closePageSelector() {
    pageDrawer.classList.remove('show');
    setTimeout(() => pageDrawer.style.display = 'none', 300);
  }

  // 加载页面列表
  async function loadPages(query = '') {
    if (!currentSettings.oauthToken) {
      updateStatus('请先登录Notion', 'error');
      return;
    }

    showLoadingState();
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getNotionPages',
        accessToken: currentSettings.oauthToken,
        query: query
      });
      
      if (response.success) {
        availablePages = response.pages;
        showPageList();
        
        if (availablePages.length === 0) {
          showEmptyState();
        }
      } else {
        updateStatus('加载页面失败: ' + response.error, 'error');
        showEmptyState();
      }
    } catch (error) {
      updateStatus('加载页面失败: ' + error.message, 'error');
      showEmptyState();
    }
  }

  function showLoadingState() {
    loadingPages.style.display = 'block';
    pageList.style.display = 'none';
    emptyPages.style.display = 'none';
  }

  function showPageList() {
    loadingPages.style.display = 'none';
    pageList.style.display = 'block';
    emptyPages.style.display = 'none';
    
    renderPageList();
  }

  function showEmptyState() {
    loadingPages.style.display = 'none';
    pageList.style.display = 'none';
    emptyPages.style.display = 'block';
  }

  function renderPageList() {
    pageList.innerHTML = '';
    
    availablePages.forEach(page => {
      const pageItem = document.createElement('div');
      pageItem.className = 'page-item';
      if (selectedPageData && selectedPageData.id === page.id) {
        pageItem.classList.add('selected');
      }
      
      pageItem.innerHTML = `
        <div class="page-item-icon">${page.icon || '📄'}</div>
        <div class="page-item-info">
          <div class="page-item-title">${page.title}</div>
          <div class="page-item-date">${formatDate(page.last_edited_time)}</div>
        </div>
      `;
      
      pageItem.addEventListener('click', () => selectPage(page));
      pageList.appendChild(pageItem);
    });
  }

  function selectPage(page) {
    selectedPageData = page;
    
    // 更新UI
    selectedPageIcon.textContent = page.icon || '📄';
    selectedPageTitle.textContent = page.title;
    
    // 保存到storage
    chrome.storage.sync.set({
      selectedPageId: page.id,
      selectedPageTitle: page.title,
      selectedPageIcon: page.icon
    });
    
    // 更新当前设置
    currentSettings.pageId = page.id;
    
    // 关闭抽屉
    closePageSelector();
    
    // 重新渲染页面列表以更新选中状态
    renderPageList();
    
    updateStatus('已选择页面: ' + page.title, 'success');
  }

  async function loadSelectedPage() {
    const result = await chrome.storage.sync.get(['selectedPageId', 'selectedPageTitle', 'selectedPageIcon']);
    
    if (result.selectedPageId) {
      selectedPageData = {
        id: result.selectedPageId,
        title: result.selectedPageTitle,
        icon: result.selectedPageIcon
      };
      
      selectedPageIcon.textContent = result.selectedPageIcon || '📄';
      selectedPageTitle.textContent = result.selectedPageTitle || 'Unknown Page';
      currentSettings.pageId = result.selectedPageId;
    }
  }

  // 页面搜索
  function handlePageSearch(event) {
    const query = event.target.value.trim();
    loadPages(query);
  }

  // 检查当前页面
  function checkCurrentPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      
      if (!currentTab.url.includes('xiaohongshu.com')) {
        updateStatus('请在小红书页面使用此工具', 'info');
        return;
      }

      const timeout = setTimeout(() => {
        updateStatus('连接超时，请刷新页面后重试', 'error');
      }, 5000);
      
      chrome.tabs.sendMessage(currentTab.id, { action: 'extractContent' }, function(response) {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          updateStatus('无法连接到页面，请刷新后重试。错误：' + chrome.runtime.lastError.message, 'error');
          return;
        }

        if (response && response.success) {
          currentPageData = response.data;
          showPreview(response.data);
          updateClipButtonState();
          updateStatus('已检测到帖子内容，可以开始剪藏', 'success');
        } else {
          updateStatus(response?.error || '未检测到帖子内容', 'error');
        }
      });
    });
  }

  function updateClipButtonState() {
    if (currentSettings.authMethod === 'oauth') {
      clipBtn.disabled = !currentPageData || !selectedPageData;
    } else {
      clipBtn.disabled = !currentPageData;
    }
  }

  function showPreview(data) {
    document.getElementById('previewTitle').textContent = data.title || '无标题';
    document.getElementById('previewContent').textContent = 
      data.content ? (data.content.substring(0, 100) + (data.content.length > 100 ? '...' : '')) : '无内容';
    
    const imagesContainer = document.getElementById('previewImages');
    imagesContainer.innerHTML = '';
    
    if (data.images && data.images.length > 0) {
      data.images.slice(0, 5).forEach(imgUrl => {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.className = 'preview-image';
        img.onerror = () => img.style.display = 'none';
        imagesContainer.appendChild(img);
      });
    }
    
    preview.style.display = 'block';
  }

  function updateStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
  }

  function toggleSettings() {
    const isVisible = settingsPanel.style.display === 'block';
    settingsPanel.style.display = isVisible ? 'none' : 'block';
  }

  // 剪藏到Notion
  async function clipToNotion() {
    if (!currentPageData) {
      updateStatus('没有可剪藏的内容', 'error');
      return;
    }

    let settings;
    
    if (currentSettings.authMethod === 'oauth') {
      if (!selectedPageData) {
        updateStatus('请先选择目标页面', 'error');
        openPageSelector();
        return;
      }
      settings = {
        notionToken: currentSettings.oauthToken,
        pageId: selectedPageData.id
      };
    } else {
      settings = await getManualSettings();
      if (!settings.notionToken || !settings.pageId) {
        updateStatus('请先配置Notion设置', 'error');
        toggleSettings();
        return;
      }
    }

    clipBtn.disabled = true;
    updateStatus('正在剪藏到Notion...', 'info');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'clipToNotion',
        data: currentPageData,
        settings: settings
      });

      if (response.success) {
        updateStatus('剪藏成功！', 'success');
      } else {
        updateStatus('剪藏失败: ' + response.error, 'error');
      }
    } catch (error) {
      updateStatus('剪藏失败: ' + error.message, 'error');
    }

    updateClipButtonState();
  }

  async function loadSettings() {
    const result = await chrome.storage.sync.get(['notionToken', 'pageId']);
    if (result.notionToken) {
      document.getElementById('notionToken').value = result.notionToken;
    }
    if (result.pageId) {
      document.getElementById('pageId').value = result.pageId;
    }
  }

  function saveSettings() {
    const notionToken = document.getElementById('notionToken').value.trim();
    const pageId = document.getElementById('pageId').value.trim();

    if (!notionToken || !pageId) {
      updateStatus('请填写完整的设置信息', 'error');
      return;
    }

    chrome.storage.sync.set({
      notionToken: notionToken,
      pageId: pageId,
      authMethod: 'manual'
    }, function() {
      updateStatus('设置保存成功', 'success');
      settingsPanel.style.display = 'none';
      currentSettings.authMethod = 'manual';
      showLoggedOutState();
    });
  }

  function getManualSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['notionToken', 'pageId'], function(result) {
        resolve(result);
      });
    });
  }

  // 工具函数
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays} 天前`;
    
    return date.toLocaleDateString('zh-CN');
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
});