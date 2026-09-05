document.addEventListener('DOMContentLoaded', function() {
  // State Management
  const AppState = {
    isLoggedIn: false,
    currentPageData: null,
    currentTarget: null, // { id, title, icon, url, type: 'page' | 'database' }
    workspaceNodes: [], // 扁平节点列表，带parentId/parentType，用于客户端拼装层级树
    expandedIds: new Set(), // 已展开的树节点id
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
    allPagesList: document.getElementById('allPagesList'),
    pagesLoading: document.getElementById('pagesLoading'),
    pagesEmpty: document.getElementById('pagesEmpty'),

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
      const result = await chrome.storage.sync.get([
        'oauthToken', 'workspaceName', 'workspaceIcon', 'authMethod',
        'defaultTarget',
        'defaultTargetId', 'defaultTargetType', 'defaultPageId' // 旧版本字段，用于迁移
      ]);

      if (result.oauthToken && result.authMethod === 'oauth') {
        AppState.isLoggedIn = true;
        AppState.accessToken = result.oauthToken;
        AppState.workspace = {
          name: result.workspaceName,
          icon: result.workspaceIcon
        };

        if (result.defaultTarget) {
          AppState.currentTarget = result.defaultTarget;
        } else {
          // 兼容旧版本：只存了id/type（或更早的defaultPageId），用占位信息展示，抽屉里会实时补全
          const targetId = result.defaultTargetId || result.defaultPageId;
          const targetType = result.defaultTargetType || (result.defaultPageId ? 'page' : null);
          AppState.currentTarget = targetId
            ? { id: targetId, type: targetType || 'page', title: targetType === 'database' ? '已选数据库' : '已选页面', icon: targetType === 'database' ? '🗂️' : '📄' }
            : null;
        }

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
    AppState.currentTarget = null;
    AppState.workspaceNodes = [];
    AppState.expandedIds = new Set();
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

  // Target(页面/数据库) selection
  function updatePageSelector() {
    if (AppState.currentTarget) {
      const typeLabel = AppState.currentTarget.type === 'database' ? '🗂️' : (AppState.currentTarget.icon || '📄');
      elements.currentPageIcon.textContent = typeLabel;
      elements.currentPageTitle.textContent = AppState.currentTarget.title.length > 12 ? AppState.currentTarget.title.substring(0, 12) + '...' : AppState.currentTarget.title;
    } else {
      elements.currentPageIcon.textContent = '📄';
      elements.currentPageTitle.textContent = '选择保存位置';
    }
  }

  function updateClipButton() {
    const canClip = AppState.isLoggedIn && AppState.currentPageData && AppState.currentTarget;
    elements.clipBtn.disabled = !canClip;

    if (!AppState.isLoggedIn) {
      elements.clipBtn.innerHTML = '<span>📎</span><span>请先连接 Notion</span>';
    } else if (!AppState.currentTarget) {
      elements.clipBtn.innerHTML = '<span>📎</span><span>请先选择保存位置</span>';
    } else if (!AppState.currentPageData) {
      elements.clipBtn.innerHTML = '<span>📎</span><span>请在小红书页面使用</span>';
    } else {
      elements.clipBtn.innerHTML = '<span>📎</span><span>保存到 Notion</span>';
    }
  }

  // Drawer management：树形结构展示Notion工作区里已授权的页面/数据库，与真实层级同步
  function openPageDrawer() {
    elements.pageDrawer.classList.remove('hidden');
    loadWorkspaceTree();
  }

  function closePageDrawer() {
    elements.pageDrawer.classList.add('hidden');
  }

  async function loadWorkspaceTree() {
    if (!AppState.accessToken) return;

    elements.pagesLoading.classList.remove('hidden');
    elements.pagesEmpty.classList.add('hidden');
    elements.allPagesList.innerHTML = '';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getWorkspaceTree',
        accessToken: AppState.accessToken
      });

      if (response.success) {
        AppState.workspaceNodes = response.nodes;
        renderWorkspaceTree();
      } else {
        showEmptyWorkspace();
        showToast('加载失败', response.error, 'error');
      }
    } catch (error) {
      showEmptyWorkspace();
      showToast('加载失败', error.message, 'error');
    } finally {
      elements.pagesLoading.classList.add('hidden');
    }
  }

  function renderWorkspaceTree() {
    const container = elements.allPagesList;
    container.innerHTML = '';

    if (AppState.workspaceNodes.length === 0) {
      showEmptyWorkspace();
      return;
    }

    const nodeById = new Map(AppState.workspaceNodes.map(n => [n.id, n]));
    const childrenByParent = new Map();
    AppState.workspaceNodes.forEach(node => {
      // parentId不存在于当前集合里的（工作区顶层，或父节点不可见），都当作根节点
      const key = node.parentType === 'workspace' || !nodeById.has(node.parentId) ? 'root' : node.parentId;
      if (!childrenByParent.has(key)) childrenByParent.set(key, []);
      childrenByParent.get(key).push(node);
    });

    const roots = childrenByParent.get('root') || [];
    if (roots.length === 0) {
      showEmptyWorkspace();
      return;
    }

    const renderLevel = (nodes, depth) => {
      nodes.forEach(node => {
        const children = childrenByParent.get(node.id) || [];
        container.appendChild(renderTreeItem(node, depth, children.length > 0));
        if (children.length > 0 && AppState.expandedIds.has(node.id)) {
          renderLevel(children, depth + 1);
        }
      });
    };

    renderLevel(roots, 0);
  }

  function renderTreeItem(node, depth, hasChildren = false) {
    const item = document.createElement('div');
    const isSelected = AppState.currentTarget?.type === node.type && AppState.currentTarget?.id === node.id;
    const isExpanded = AppState.expandedIds.has(node.id);
    item.className = `page-item ${isSelected ? 'selected' : ''}`;
    item.style.paddingLeft = `${12 + depth * 20}px`;

    const defaultIcon = node.type === 'database' ? '🗂️' : '📄';
    const toggleHtml = hasChildren
      ? `<span class="tree-toggle" data-expanded="${isExpanded}">${isExpanded ? '▾' : '▸'}</span>`
      : `<span class="tree-toggle-spacer"></span>`;

    item.innerHTML = `
      <div class="page-item-info">
        <div class="page-item-title">
          ${toggleHtml}
          <span>${node.icon || defaultIcon}</span>
          <span>${node.title.length > 16 ? node.title.substring(0, 16) + '...' : node.title}</span>
        </div>
      </div>
      <div class="page-item-action">
        ${isSelected
          ? '<span class="page-badge">默认</span>'
          : '<span class="page-badge secondary">切换</span>'
        }
      </div>
    `;

    if (hasChildren) {
      const toggle = item.querySelector('.tree-toggle');
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (AppState.expandedIds.has(node.id)) {
          AppState.expandedIds.delete(node.id);
        } else {
          AppState.expandedIds.add(node.id);
        }
        renderWorkspaceTree();
      });
    }

    item.addEventListener('click', () => selectTarget(node));
    return item;
  }

  function showEmptyWorkspace() {
    elements.allPagesList.innerHTML = '';
    elements.pagesEmpty.classList.remove('hidden');
  }

  async function selectTarget(target) {
    AppState.currentTarget = target;

    await chrome.storage.sync.set({
      defaultTarget: {
        id: target.id,
        type: target.type,
        title: target.title,
        icon: target.icon,
        url: target.url
      }
    });

    updatePageSelector();
    updateClipButton();
    closePageDrawer();

    showToast('设置成功', `默认保存到「${target.title.length > 10 ? target.title.substring(0, 10) + '...' : target.title}」`, 'success', 2000);
  }

  // Clipping
  async function handleClip() {
    if (!AppState.currentPageData || !AppState.currentTarget || !AppState.accessToken) {
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
          targetId: AppState.currentTarget.id,
          targetType: AppState.currentTarget.type
        }
      });

      if (response.success) {
        switchToSuccessView(response.pageUrl);
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
  let lastClipPageUrl = null;

  function handleGotoNotion() {
    const url = lastClipPageUrl || AppState.currentTarget?.url;
    window.open(url || 'https://www.notion.so', '_blank');
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

  function switchToSuccessView(pageUrl) {
    AppState.currentView = 'success';
    lastClipPageUrl = pageUrl || null;

    // Update success page info
    elements.successPageIcon.textContent = AppState.currentTarget?.type === 'database' ? '🗂️' : (AppState.currentTarget?.icon || '📄');
    const pageTitle = AppState.currentTarget?.title || '我的页面';
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