document.addEventListener('DOMContentLoaded', function() {
  // State Management
  const AppState = {
    isLoggedIn: false,
    currentPageData: null,
    currentPage: null,
    allPages: [],
    accessToken: null,
    workspace: null,
    currentView: 'welcome' // welcome, main, success
  };

  // DOM References
  const elements = {
    // Page states
    welcomeState: document.getElementById('welcomeState'),
    mainState: document.getElementById('mainState'),
    successState: document.getElementById('successState'),
    
    // Header
    headerActions: document.getElementById('headerActions'),
    
    // Status
    statusBar: document.getElementById('statusBar'),
    statusMessage: document.getElementById('statusMessage'),
    
    // Welcome/Login
    loginBtn: document.getElementById('loginBtn'),
    
    // Main content
    contentPreview: document.getElementById('contentPreview'),
    previewTitle: document.getElementById('previewTitle'),
    previewContent: document.getElementById('previewContent'),
    previewImages: document.getElementById('previewImages'),
    previewTags: document.getElementById('previewTags'),
    currentPageIcon: document.getElementById('currentPageIcon'),
    currentPageTitle: document.getElementById('currentPageTitle'),
    selectPageBtn: document.getElementById('selectPageBtn'),
    clipBtn: document.getElementById('clipBtn'),
    
    // Success state
    successPageInfo: document.getElementById('successPageInfo'),
    successPageIcon: document.getElementById('successPageIcon'),
    successPageName: document.getElementById('successPageName'),
    gotoNotionBtn: document.getElementById('gotoNotionBtn'),
    continueClipBtn: document.getElementById('continueClipBtn'),
    
    // Drawer
    pageDrawer: document.getElementById('pageDrawer'),
    drawerBackBtn: document.getElementById('drawerBackBtn'),
    pageSearchInput: document.getElementById('pageSearchInput'),
    allPagesList: document.getElementById('allPagesList'),
    pagesLoading: document.getElementById('pagesLoading'),
    pagesEmpty: document.getElementById('pagesEmpty'),
    createPageBtn: document.getElementById('createPageBtn'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // Initialize
  init();

  async function init() {
    bindEvents();
    await checkAuthStatus();
    await checkCurrentPage();
  }

  function bindEvents() {
    // Login
    elements.loginBtn.addEventListener('click', handleLogin);
    
    // Page selection
    elements.selectPageBtn.addEventListener('click', openPageDrawer);
    elements.drawerBackBtn.addEventListener('click', closePageDrawer);
    
    // Clipping
    elements.clipBtn.addEventListener('click', handleClip);
    
    // Content preview interactions will be handled inline
    
    // Success actions
    elements.gotoNotionBtn.addEventListener('click', handleGotoNotion);
    elements.continueClipBtn.addEventListener('click', handleContinueClip);
    
    // Drawer interactions
    elements.pageDrawer.addEventListener('click', (e) => {
      if (e.target === elements.pageDrawer) closePageDrawer();
    });
    
    elements.pageSearchInput.addEventListener('input', debounce(handlePageSearch, 300));
    elements.createPageBtn.addEventListener('click', handleCreatePage);

    // Storage changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.oauthToken || changes.authMethod) {
        checkAuthStatus();
      }
    });
  }

  // Authentication
  async function checkAuthStatus() {
    try {
      const result = await chrome.storage.sync.get(['oauthToken', 'workspaceName', 'workspaceIcon', 'authMethod', 'defaultPageId', 'managedPages']);
      
      if (result.oauthToken && result.authMethod === 'oauth') {
        AppState.isLoggedIn = true;
        AppState.accessToken = result.oauthToken;
        AppState.workspace = {
          name: result.workspaceName,
          icon: result.workspaceIcon
        };
        
        // Load managed pages
        AppState.allPages = result.managedPages || [];
        AppState.currentPage = AppState.allPages.find(p => p.id === result.defaultPageId) || null;
        
        updateHeaderForLoggedIn();
        switchToMainView();
        updatePageSelector();
        updateClipButton();
      } else {
        AppState.isLoggedIn = false;
        switchToWelcomeView();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      showStatus('检查登录状态失败', 'error');
    }
  }

  async function handleLogin() {
    elements.loginBtn.disabled = true;
    elements.loginBtn.innerHTML = '<div class="loading"></div><span>连接中...</span>';
    showStatus('正在跳转到 Notion 授权页面...', 'info');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'notionOAuth' });
      
      if (response.success) {
        showStatus('连接成功！正在加载...', 'success');
        setTimeout(() => {
          checkAuthStatus();
        }, 500);
      } else {
        showStatus('连接失败: ' + response.error, 'error');
      }
    } catch (error) {
      showStatus('连接失败: ' + error.message, 'error');
    } finally {
      elements.loginBtn.disabled = false;
      elements.loginBtn.innerHTML = '<span>🚀</span><span>立即开始</span>';
    }
  }

  function updateHeaderForLoggedIn() {
    elements.headerActions.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 text-sm" style="color: rgba(255,255,255,0.9);">
          ${AppState.workspace?.icon ? `<img src="${AppState.workspace.icon}" style="width: 16px; height: 16px; border-radius: 3px;">` : ''}
          <span>${AppState.workspace?.name || 'Workspace'}</span>
        </div>
        <button id="logoutBtn" class="btn-icon" style="background: transparent; color: white;" title="退出登录">
          <img src="images/logout-icon.svg" style="width: 16px; height: 16px; filter: brightness(0) invert(1);">
        </button>
      </div>
    `;
    
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  }

  async function handleLogout() {
    await chrome.storage.sync.clear();
    AppState.isLoggedIn = false;
    AppState.accessToken = null;
    AppState.workspace = null;
    AppState.currentPage = null;
    AppState.allPages = [];
    switchToWelcomeView();
    elements.headerActions.innerHTML = '';
    showStatus('已退出登录', 'info');
  }

  // Page content detection
  async function checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('xiaohongshu.com')) {
        // Clear content preview when not on xiaohongshu
        AppState.currentPageData = null;
        showContentPreview(null);
        updateClipButton();
        if (AppState.isLoggedIn) {
          showStatus('💡 请先打开小红书页面，然后使用此扩展', 'info');
        }
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
      
      if (response?.success) {
        AppState.currentPageData = response.data;
        showContentPreview(response.data);
        updateClipButton();
        if (AppState.isLoggedIn) {
          showStatus('', ''); // Clear status
        }
      } else {
        // Clear content preview when extraction fails
        AppState.currentPageData = null;
        showContentPreview(null);
        updateClipButton();
        showStatus(response?.error || '未检测到帖子内容', 'error');
      }
    } catch (error) {
      console.error('Content check error:', error);
      // Clear content preview on error
      AppState.currentPageData = null;
      showContentPreview(null);
      updateClipButton();
      if (AppState.isLoggedIn) {
        showStatus('无法连接到页面，请刷新后重试', 'error');
      }
    }
  }

  function showContentPreview(data) {
    console.log('showContentPreview called with:', data);
    
    if (!data) {
      console.log('No data provided, clearing all preview elements');
      // Clear all preview elements when no data
      elements.previewTitle.textContent = '';
      elements.previewTitle.style.display = 'none';
      elements.previewContent.innerHTML = '';
      elements.previewContent.style.display = 'none';
      elements.previewImages.innerHTML = '';
      elements.previewTags.innerHTML = '';
      elements.previewTags.style.display = 'none';
      elements.contentPreview.style.display = 'none';
      return;
    }

    // Always clear all elements first to prevent stale data
    elements.previewTitle.textContent = '';
    elements.previewContent.innerHTML = '';
    elements.previewImages.innerHTML = '';
    elements.previewTags.innerHTML = '';

    // Show title - only if exists and not empty
    console.log('Processing title:', data.title, typeof data.title);
    if (data.title && typeof data.title === 'string' && data.title.trim()) {
      console.log('Showing title:', data.title.trim());
      elements.previewTitle.textContent = data.title.trim();
      elements.previewTitle.style.display = 'block';
    } else {
      console.log('Hiding title, no valid title found');
      elements.previewTitle.style.display = 'none';
    }
    
    // Show content with smart truncation
    if (data.content && data.content.trim()) {
      const content = data.content.length > 100 
        ? data.content.substring(0, 100) + '...' 
        : data.content;
      
      elements.previewContent.innerHTML = `
        <span class="preview-text-short">${content}</span>
      `;
      elements.previewContent.style.display = 'block';
    } else {
      elements.previewContent.style.display = 'none';
    }
    
    // Show images (limit to 6 for space)
    if (data.images && data.images.length > 0) {
      data.images.slice(0, 6).forEach((imgUrl, index) => {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.className = 'preview-image';
        img.title = `图片 ${index + 1}`;
        img.onerror = () => img.style.display = 'none';
        elements.previewImages.appendChild(img);
      });
      
      // Show count if more images exist
      if (data.images.length > 6) {
        const countSpan = document.createElement('span');
        countSpan.style.cssText = 'font-size: 11px; color: #999; margin-left: 8px;';
        countSpan.textContent = `+${data.images.length - 6}`;
        elements.previewImages.appendChild(countSpan);
      }
    }
    
    // Show tags (limit to 3 for space)
    if (data.tags && data.tags.length > 0) {
      elements.previewTags.style.display = 'flex';
      data.tags.slice(0, 3).forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'preview-tag';
        tagElement.textContent = tag;
        elements.previewTags.appendChild(tagElement);
      });
      
      if (data.tags.length > 3) {
        const moreTag = document.createElement('span');
        moreTag.className = 'preview-tag';
        moreTag.textContent = `+${data.tags.length - 3}`;
        moreTag.style.opacity = '0.6';
        elements.previewTags.appendChild(moreTag);
      }
    } else {
      elements.previewTags.style.display = 'none';
    }
    
    elements.contentPreview.style.display = 'block';
  }

  // Page selection
  function updatePageSelector() {
    if (AppState.currentPage) {
      elements.currentPageIcon.textContent = AppState.currentPage.icon || '📄';
      elements.currentPageTitle.textContent = AppState.currentPage.title.length > 12 ? AppState.currentPage.title.substring(0, 12) + '...' : AppState.currentPage.title;
    } else {
      elements.currentPageIcon.textContent = '📄';
      elements.currentPageTitle.textContent = '选择页面';
    }
  }

  function updateClipButton() {
    const canClip = AppState.isLoggedIn && AppState.currentPageData && AppState.currentPage;
    elements.clipBtn.disabled = !canClip;
    
    if (!AppState.isLoggedIn) {
      elements.clipBtn.innerHTML = '<span>📎</span><span>请先连接 Notion</span>';
    } else if (!AppState.currentPage) {
      elements.clipBtn.innerHTML = '<span>📎</span><span>请先选择页面</span>';
    } else if (!AppState.currentPageData) {
      elements.clipBtn.innerHTML = '<span>📎</span><span>请在小红书页面使用</span>';
    } else {
      elements.clipBtn.innerHTML = '<span>📎</span><span>保存到 Notion</span>';
    }
  }

  // Drawer management
  function openPageDrawer() {
    elements.pageDrawer.classList.remove('hidden');
    loadAvailablePages();
    elements.pageSearchInput.focus();
  }

  function closePageDrawer() {
    elements.pageDrawer.classList.add('hidden');
    elements.pageSearchInput.value = '';
  }

  async function loadAvailablePages(query = '') {
    if (!AppState.accessToken) return;

    // Show loading
    elements.pagesLoading.classList.remove('hidden');
    elements.pagesEmpty.classList.add('hidden');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getNotionPages',
        accessToken: AppState.accessToken,
        query: query
      });

      if (response.success) {
        AppState.allPages = response.pages;
        renderPageLists();
      } else {
        showEmptyPages();
        showToast('加载失败', response.error, 'error');
      }
    } catch (error) {
      showEmptyPages();
      showToast('加载失败', error.message, 'error');
    } finally {
      elements.pagesLoading.classList.add('hidden');
    }
  }

  function renderPageLists() {
    // Render all pages
    renderPageList(elements.allPagesList, AppState.allPages);
  }

  function renderPageList(container, pages) {
    container.innerHTML = '';
    
    if (pages.length === 0) {
      showEmptyPages();
      return;
    }

    pages.forEach(page => {
      const pageItem = document.createElement('div');
      pageItem.className = `page-item ${AppState.currentPage?.id === page.id ? 'selected' : ''}`;
      
      pageItem.innerHTML = `
        <div class="page-item-info">
          <div class="page-item-title">
            <span>${page.icon || '📄'}</span>
            <span>${page.title.length > 12 ? page.title.substring(0, 12) + '...' : page.title}</span>
          </div>
          <div class="page-item-meta">更新于 ${getRelativeTime(page.last_edited_time)}</div>
        </div>
        <div class="page-item-action">
          ${AppState.currentPage?.id === page.id 
            ? '<span class="page-badge">默认</span>' 
            : '<span class="page-badge secondary">切换</span>'
          }
        </div>
      `;
      
      pageItem.addEventListener('click', () => selectPage(page));
      container.appendChild(pageItem);
    });
  }

  function showEmptyPages() {
    elements.allPagesList.innerHTML = '';
    elements.pagesEmpty.classList.remove('hidden');
  }

  async function selectPage(page) {
    AppState.currentPage = page;
    
    // Save to storage
    await chrome.storage.sync.set({
      defaultPageId: page.id,
      managedPages: AppState.allPages
    });
    
    updatePageSelector();
    updateClipButton();
    closePageDrawer();
    
    showToast('设置成功', `默认保存到「${page.title.length > 10 ? page.title.substring(0, 10) + '...' : page.title}」`, 'success', 2000);
  }

  function handlePageSearch(event) {
    const query = event.target.value.trim();
    loadAvailablePages(query);
  }

  function handleCreatePage() {
    window.open('https://www.notion.so', '_blank');
  }

  // Clipping
  async function handleClip() {
    if (!AppState.currentPageData || !AppState.currentPage || !AppState.accessToken) {
      showToast('剪藏失败', '缺少必要信息', 'error');
      return;
    }

    elements.clipBtn.disabled = true;
    elements.clipBtn.innerHTML = '<div class="loading"></div><span>保存中...</span>';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'clipToNotion',
        data: AppState.currentPageData,
        settings: {
          notionToken: AppState.accessToken,
          pageId: AppState.currentPage.id
        }
      });

      if (response.success) {
        switchToSuccessView();
      } else {
        showToast('保存失败', response.error, 'error');
        updateClipButton();
      }
    } catch (error) {
      showToast('保存失败', error.message, 'error');
      updateClipButton();
    }
  }

  // Success handling
  function handleGotoNotion() {
    if (AppState.currentPage?.url) {
      window.open(AppState.currentPage.url, '_blank');
    } else {
      window.open('https://www.notion.so', '_blank');
    }
  }

  function handleContinueClip() {
    switchToMainView();
    checkCurrentPage();
  }

  // View management
  function switchToWelcomeView() {
    AppState.currentView = 'welcome';
    switchPageState(elements.welcomeState);
  }

  function switchToMainView() {
    AppState.currentView = 'main';
    switchPageState(elements.mainState);
  }

  function switchToSuccessView() {
    AppState.currentView = 'success';
    
    // Update success page info
    elements.successPageIcon.textContent = AppState.currentPage?.icon || '📄';
    const pageTitle = AppState.currentPage?.title || '我的页面';
    elements.successPageName.textContent = pageTitle.length > 15 ? pageTitle.substring(0, 15) + '...' : pageTitle;
    
    switchPageState(elements.successState);
  }

  function switchPageState(targetState) {
    // Remove active and visible from all states
    [elements.welcomeState, elements.mainState, elements.successState].forEach(state => {
      state.classList.remove('active', 'visible');
    });

    // Activate target state
    targetState.classList.add('active');
    
    // Trigger animation
    setTimeout(() => {
      targetState.classList.add('visible');
    }, 10);
  }

  // Status management
  function showStatus(message, type) {
    if (!message) {
      elements.statusBar.style.display = 'none';
      return;
    }

    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status status-${type}`;
    elements.statusBar.style.display = 'block';
  }

  // Toast notifications
  function showToast(title, message, type = 'success', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.success}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="关闭">&times;</button>
    `;

    elements.toastContainer.appendChild(toast);
    
    // Find close button
    const closeBtn = toast.querySelector('.toast-close');
    
    // Close button handler
    closeBtn.addEventListener('click', () => {
      removeToast(toast);
    });
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto remove
    if (duration > 0) {

      // Auto remove
      setTimeout(() => {
        if (toast.parentNode) {
          removeToast(toast);
        }
      }, duration);
    }

    return toast;
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }

  // Utility functions
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

  function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return date.toLocaleDateString();
  }
});