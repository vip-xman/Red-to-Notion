document.addEventListener('DOMContentLoaded', function() {
  const clipBtn = document.getElementById('clipBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const saveBtn = document.getElementById('saveBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const status = document.getElementById('status');
  const preview = document.getElementById('preview');
  
  let currentPageData = null;

  loadSettings();
  checkCurrentPage();

  clipBtn.addEventListener('click', clipToNotion);
  settingsBtn.addEventListener('click', toggleSettings);
  saveBtn.addEventListener('click', saveSettings);

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
          clipBtn.disabled = false;
          updateStatus('已检测到帖子内容，可以开始剪藏', 'success');
        } else {
          updateStatus(response?.error || '未检测到帖子内容', 'error');
        }
      });
    });
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

  async function clipToNotion() {
    if (!currentPageData) {
      updateStatus('没有可剪藏的内容', 'error');
      return;
    }

    const settings = await getSettings();
    if (!settings.notionToken || !settings.pageId) {
      updateStatus('请先配置Notion设置', 'error');
      toggleSettings();
      return;
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

    clipBtn.disabled = false;
  }

  function loadSettings() {
    chrome.storage.sync.get(['notionToken', 'pageId'], function(result) {
      if (result.notionToken) {
        document.getElementById('notionToken').value = result.notionToken;
      }
      if (result.pageId) {
        document.getElementById('pageId').value = result.pageId;
      }
    });
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
      pageId: pageId
    }, function() {
      updateStatus('设置保存成功', 'success');
      settingsPanel.style.display = 'none';
    });
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['notionToken', 'pageId'], function(result) {
        resolve(result);
      });
    });
  }
});