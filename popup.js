document.addEventListener('DOMContentLoaded', function() {
  // DOM 元素引用
  const elements = {
    // 状态和主要区域
    status: document.getElementById('status'),
    loginSection: document.getElementById('loginSection'),
    loggedInSection: document.getElementById('loggedInSection'),
    
    // 登录相关
    oauthBtn: document.getElementById('oauthBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    workspaceName: document.getElementById('workspaceName'),
    workspaceIcon: document.getElementById('workspaceIcon'),
    
    // 页面管理相关
    managePagesBtn: document.getElementById('managePagesBtn'),
    defaultPageSection: document.getElementById('defaultPageSection'),
    defaultPageIcon: document.getElementById('defaultPageIcon'),
    defaultPageTitle: document.getElementById('defaultPageTitle'),
    changePageBtn: document.getElementById('changePageBtn'),
    
    // 抽屉相关
    pageDrawer: document.getElementById('pageDrawer'),
    closeDrawer: document.getElementById('closeDrawer'),
    managedPagesList: document.getElementById('managedPagesList'),
    noManagedPages: document.getElementById('noManagedPages'),
    pageSearchInput: document.getElementById('pageSearchInput'),
    loadingPages: document.getElementById('loadingPages'),
    availablePagesList: document.getElementById('availablePagesList'),
    emptyPages: document.getElementById('emptyPages'),
    
    // 内容和剪藏
    preview: document.getElementById('preview'),
    previewTitle: document.getElementById('previewTitle'),
    previewContent: document.getElementById('previewContent'),
    previewImages: document.getElementById('previewImages'),
    clipBtn: document.getElementById('clipBtn')
  };

  // 状态管理
  let state = {
    isLoggedIn: false,
    currentPageData: null,
    managedPages: [],
    defaultPage: null,
    availablePages: [],
    oauthToken: null
  };

  // 初始化
  init();

  async function init() {
    bindEvents();
    await checkAuthStatus();
    await loadManagedPages();
    checkCurrentPage();
  }

  function bindEvents() {
    // OAuth 登录/登出
    elements.oauthBtn.addEventListener('click', handleOAuthLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // 页面管理
    elements.managePagesBtn.addEventListener('click', openPageManager);
    elements.changePageBtn.addEventListener('click', openPageManager);
    elements.closeDrawer.addEventListener('click', closePageManager);
    
    // 抽屉点击外部关闭
    elements.pageDrawer.addEventListener('click', (e) => {
      if (e.target === elements.pageDrawer) closePageManager();
    });
    
    // 页面搜索
    elements.pageSearchInput.addEventListener('input', debounce(handlePageSearch, 300));
    
    // 剪藏按钮
    elements.clipBtn.addEventListener('click', clipToNotion);
  }

  // 检查认证状态
  async function checkAuthStatus() {
    const result = await chrome.storage.sync.get(['oauthToken', 'workspaceName', 'workspaceIcon', 'authMethod']);
    
    // 添加调试日志
    console.log('🔍 检查认证状态:', result);
    
    if (result.oauthToken && result.authMethod === 'oauth') {
      console.log('✅ 用户已登录');
      state.isLoggedIn = true;
      state.oauthToken = result.oauthToken;
      showLoggedInState(result);
    } else {
      console.log('❌ 用户未登录，状态:', { hasToken: !!result.oauthToken, authMethod: result.authMethod });
      state.isLoggedIn = false;
      showLoggedOutState();
    }
  }

  function showLoggedInState(data) {
    elements.loginSection.style.display = 'none';
    elements.loggedInSection.style.display = 'block';
    
    elements.workspaceName.textContent = data.workspaceName || 'Notion Workspace';
    
    if (data.workspaceIcon) {
      elements.workspaceIcon.src = data.workspaceIcon;
      elements.workspaceIcon.style.display = 'block';
    } else {
      elements.workspaceIcon.style.display = 'none';
    }
    
    updateStatus('已连接到 Notion', 'success');
  }

  function showLoggedOutState() {
    elements.loginSection.style.display = 'block';
    elements.loggedInSection.style.display = 'none';
    
    updateStatus('请先登录 Notion 账号', 'info');
  }

  // OAuth 登录处理
  async function handleOAuthLogin() {
    console.log('🚀 开始OAuth登录');
    elements.oauthBtn.disabled = true;
    elements.oauthBtn.textContent = '🔄 正在授权...';
    updateStatus('正在跳转到 Notion 授权页面...', 'info');

    try {
      console.log('📤 发送OAuth请求到background');
      const response = await chrome.runtime.sendMessage({ action: 'notionOAuth' });
      console.log('📥 收到OAuth响应:', response);
      
      if (response.success) {
        console.log('✅ OAuth成功，检查认证状态');
        updateStatus('授权成功！正在加载...', 'success');
        await checkAuthStatus();
        await loadManagedPages();
        console.log('🔄 状态更新完成');
      } else {
        console.log('❌ OAuth失败:', response.error);
        updateStatus('授权失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.log('💥 OAuth异常:', error);
      updateStatus('授权失败: ' + error.message, 'error');
    }

    elements.oauthBtn.disabled = false;
    elements.oauthBtn.textContent = '🚀 一键登录 Notion';
  }

  // 退出登录
  async function handleLogout() {
    await chrome.storage.sync.clear();
    state = {
      isLoggedIn: false,
      currentPageData: null,
      managedPages: [],
      defaultPage: null,
      availablePages: [],
      oauthToken: null
    };
    showLoggedOutState();
    elements.defaultPageSection.style.display = 'none';
    updateStatus('已退出登录', 'info');
  }

  // 加载已管理的页面
  async function loadManagedPages() {
    if (!state.isLoggedIn) return;
    
    const result = await chrome.storage.sync.get(['managedPages', 'defaultPageId']);
    state.managedPages = result.managedPages || [];
    
    // 更新默认页面
    if (result.defaultPageId) {
      state.defaultPage = state.managedPages.find(page => page.id === result.defaultPageId);
      if (state.defaultPage) {
        showDefaultPageSection();
      }
    }
    
    updateManagedPagesList();
    updateClipButtonState();
  }

  function showDefaultPageSection() {
    if (state.defaultPage) {
      elements.defaultPageSection.style.display = 'block';
      elements.defaultPageIcon.textContent = state.defaultPage.icon || '📄';
      elements.defaultPageTitle.textContent = state.defaultPage.title;
    }
  }

  // 打开页面管理器
  async function openPageManager() {
    elements.pageDrawer.style.display = 'block';
    setTimeout(() => elements.pageDrawer.classList.add('show'), 10);
    
    // 加载可用页面
    await loadAvailablePages();
    elements.pageSearchInput.focus();
  }

  // 关闭页面管理器
  function closePageManager() {
    elements.pageDrawer.classList.remove('show');
    setTimeout(() => elements.pageDrawer.style.display = 'none', 300);
  }

  // 加载可用页面
  async function loadAvailablePages(query = '') {
    if (!state.oauthToken) return;

    showLoadingState();
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getNotionPages',
        accessToken: state.oauthToken,
        query: query
      });
      
      if (response.success) {
        state.availablePages = response.pages;
        showAvailablePages();
      } else {
        showEmptyState();
        updateStatus('加载页面失败: ' + response.error, 'error');
      }
    } catch (error) {
      showEmptyState();
      updateStatus('加载页面失败: ' + error.message, 'error');
    }
  }

  function showLoadingState() {
    elements.loadingPages.style.display = 'block';
    elements.availablePagesList.style.display = 'none';
    elements.emptyPages.style.display = 'none';
  }

  function showAvailablePages() {
    elements.loadingPages.style.display = 'none';
    elements.availablePagesList.style.display = 'block';
    elements.emptyPages.style.display = 'none';
    
    renderAvailablePages();
  }

  function showEmptyState() {
    elements.loadingPages.style.display = 'none';
    elements.availablePagesList.style.display = 'none';
    elements.emptyPages.style.display = 'block';
  }

  function renderAvailablePages() {
    elements.availablePagesList.innerHTML = '';
    
    state.availablePages.forEach(page => {
      const isAdded = state.managedPages.some(mp => mp.id === page.id);
      
      const pageItem = document.createElement('div');
      pageItem.className = `available-page-item ${isAdded ? 'added' : ''}`;
      
      pageItem.innerHTML = `
        <div class="page-info">
          <span class="page-icon">${page.icon || '📄'}</span>
          <span class="page-title">${page.title}</span>
        </div>
      `;
      
      if (!isAdded) {
        pageItem.addEventListener('click', () => addPageToManaged(page));
      }
      
      elements.availablePagesList.appendChild(pageItem);
    });
  }

  // 添加页面到管理列表
  async function addPageToManaged(page) {
    // 添加到本地状态
    state.managedPages.push(page);
    
    // 如果是第一个页面，设置为默认
    if (state.managedPages.length === 1) {
      state.defaultPage = page;
      await chrome.storage.sync.set({ defaultPageId: page.id });
      showDefaultPageSection();
    }
    
    // 保存到 storage
    await chrome.storage.sync.set({ managedPages: state.managedPages });
    
    // 更新UI
    updateManagedPagesList();
    renderAvailablePages();
    updateClipButtonState();
    
    updateStatus(`已添加页面: ${page.title}`, 'success');
  }

  // 从管理列表移除页面
  async function removePageFromManaged(pageId) {
    state.managedPages = state.managedPages.filter(page => page.id !== pageId);
    
    // 如果删除的是默认页面，重新设置默认页面
    if (state.defaultPage && state.defaultPage.id === pageId) {
      state.defaultPage = state.managedPages.length > 0 ? state.managedPages[0] : null;
      const defaultPageId = state.defaultPage ? state.defaultPage.id : null;
      await chrome.storage.sync.set({ defaultPageId });
      
      if (state.defaultPage) {
        showDefaultPageSection();
      } else {
        elements.defaultPageSection.style.display = 'none';
      }
    }
    
    // 保存到 storage
    await chrome.storage.sync.set({ managedPages: state.managedPages });
    
    // 更新UI
    updateManagedPagesList();
    renderAvailablePages();
    updateClipButtonState();
  }

  // 设置默认页面
  async function setDefaultPage(page) {
    state.defaultPage = page;
    await chrome.storage.sync.set({ defaultPageId: page.id });
    showDefaultPageSection();
    updateManagedPagesList();
    updateStatus(`已设置默认页面: ${page.title}`, 'success');
  }

  function updateManagedPagesList() {
    if (state.managedPages.length === 0) {
      elements.noManagedPages.style.display = 'block';
      elements.managedPagesList.innerHTML = '';
      elements.managedPagesList.appendChild(elements.noManagedPages);
      return;
    }
    
    elements.noManagedPages.style.display = 'none';
    elements.managedPagesList.innerHTML = '';
    
    state.managedPages.forEach(page => {
      const isDefault = state.defaultPage && state.defaultPage.id === page.id;
      
      const pageItem = document.createElement('div');
      pageItem.className = `managed-page-item ${isDefault ? 'default' : ''}`;
      
      pageItem.innerHTML = `
        <div class="managed-page-info">
          <span class="page-icon">${page.icon || '📄'}</span>
          <span class="managed-page-title">${page.title}</span>
        </div>
        <div class="managed-page-actions">
          ${!isDefault ? `<button class="set-default-btn" data-id="${page.id}">设默认</button>` : '<span style="font-size: 11px; color: #007bff;">默认</span>'}
          <button class="remove-page-btn" data-id="${page.id}">移除</button>
        </div>
      `;
      
      // 绑定事件
      const setDefaultBtn = pageItem.querySelector('.set-default-btn');
      const removeBtn = pageItem.querySelector('.remove-page-btn');
      
      if (setDefaultBtn) {
        setDefaultBtn.addEventListener('click', () => setDefaultPage(page));
      }
      
      removeBtn.addEventListener('click', () => removePageFromManaged(page.id));
      
      elements.managedPagesList.appendChild(pageItem);
    });
  }

  // 页面搜索
  function handlePageSearch(event) {
    const query = event.target.value.trim();
    loadAvailablePages(query);
  }

  // 检查当前页面内容
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
          updateStatus('无法连接到页面，请刷新后重试', 'error');
          return;
        }

        if (response && response.success) {
          state.currentPageData = response.data;
          showPreview(response.data);
          updateClipButtonState();
          if (state.isLoggedIn) {
            updateStatus('已检测到帖子内容，可以开始剪藏', 'success');
          }
        } else {
          updateStatus(response?.error || '未检测到帖子内容', 'error');
        }
      });
    });
  }

  function showPreview(data) {
    elements.previewTitle.textContent = data.title || '无标题';
    elements.previewContent.textContent = 
      data.content ? (data.content.substring(0, 100) + (data.content.length > 100 ? '...' : '')) : '无内容';
    
    elements.previewImages.innerHTML = '';
    if (data.images && data.images.length > 0) {
      data.images.slice(0, 6).forEach(imgUrl => {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.className = 'preview-image';
        img.onerror = () => img.style.display = 'none';
        elements.previewImages.appendChild(img);
      });
    }
    
    elements.preview.style.display = 'block';
  }

  function updateClipButtonState() {
    const canClip = state.isLoggedIn && state.currentPageData && state.defaultPage;
    elements.clipBtn.disabled = !canClip;
    
    if (!state.isLoggedIn) {
      elements.clipBtn.textContent = '📎 请先登录 Notion';
    } else if (!state.defaultPage) {
      elements.clipBtn.textContent = '📎 请先添加页面';
    } else if (!state.currentPageData) {
      elements.clipBtn.textContent = '📎 请在小红书页面使用';
    } else {
      elements.clipBtn.textContent = '📎 剪藏到 Notion';
    }
  }

  // 剪藏到Notion
  async function clipToNotion() {
    if (!state.currentPageData || !state.defaultPage || !state.oauthToken) {
      updateStatus('缺少必要信息，无法剪藏', 'error');
      return;
    }

    elements.clipBtn.disabled = true;
    updateStatus('正在剪藏到 Notion...', 'info');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'clipToNotion',
        data: state.currentPageData,
        settings: {
          notionToken: state.oauthToken,
          pageId: state.defaultPage.id
        }
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

  function updateStatus(message, type) {
    elements.status.textContent = message;
    elements.status.className = `status ${type}`;
  }

  // 工具函数
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