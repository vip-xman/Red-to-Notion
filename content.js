chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    // 延迟一点等待页面完全加载
    setTimeout(() => {
      try {
        const data = extractXiaohongshuContent();
        sendResponse({ success: true, data: data });
      } catch (error) {
        console.error('Content extraction error:', error);
        sendResponse({ success: false, error: error.message });
      }
    }, 1000); // 等待1秒
    return true; // 保持消息通道开启
  }
  return true;
});

function extractXiaohongshuContent() {
  const url = window.location.href;
  
  // 支持多种小红书URL格式
  const isXiaohongshuPost = url.includes('xiaohongshu.com/explore/') || 
                           url.includes('xiaohongshu.com/discovery/item/') ||
                           url.match(/xiaohongshu\.com\/\w+\/\w+/);
  
  if (!isXiaohongshuPost) {
    throw new Error('当前页面不是小红书帖子页面，URL: ' + url);
  }

  const data = {
    title: '',
    content: '',
    images: [],
    tags: [],
    url: url
  };

  data.title = extractTitle();
  data.content = extractContent();
  data.images = extractImages();
  data.tags = extractTags();

  if (!data.title && !data.content && data.images.length === 0) {
    throw new Error('未能提取到帖子内容');
  }

  return data;
}

function extractTitle() {
  // 小红书特定的标题选择器
  const selectors = [
    '.note-detail-mask .note-title',
    '.note-detail .note-title', 
    '[class*="note-title"]',
    '.note-content .title',
    '.detail-title',
    'h1',
    '.title',
    '[class*="title"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  // 优先使用 og:title，通常比 document.title 更准确
  const metaTitle = document.querySelector('meta[property="og:title"]');
  if (metaTitle && metaTitle.content.trim()) {
    return metaTitle.content.trim();
  }

  // 最后使用 document.title
  const docTitle = document.title.replace(' - 小红书', '').trim();
  if (docTitle && docTitle !== '小红书') {
    return docTitle;
  }

  return '';
}

function extractContent() {
  const selectors = [
    '.note-content .content',
    '.note-detail .content',
    '[class*="desc"]',
    '[class*="content"]',
    '.note-text',
    '.desc'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      let content = element.textContent.trim();
      // 移除内容末尾的标签部分，避免与单独提取的标签重复
      content = content.replace(/#[^#\s]+(\s+#[^#\s]+)*$/, '').trim();
      return content;
    }
  }

  const spans = document.querySelectorAll('span');
  for (const span of spans) {
    if (span.textContent.length > 50 && !span.querySelector('a')) {
      let content = span.textContent.trim();
      // 移除内容末尾的标签部分
      content = content.replace(/#[^#\s]+(\s+#[^#\s]+)*$/, '').trim();
      return content;
    }
  }

  return '';
}

function extractImages() {
  const images = [];
  
  // 专注于note-slider-img，这是最准确的选择器
  const sliderImgs = document.querySelectorAll('.note-slider-img');
  
  if (sliderImgs.length > 0) {
    // 先收集所有图片信息
    const imageInfos = [];
    
    sliderImgs.forEach((img, index) => {
      const rect = img.getBoundingClientRect();
      const src = processImageSrc(img);
      
      if (src) {
        imageInfos.push({
          index: index,
          element: img,
          src: src,
          position: {
            left: rect.left,
            top: rect.top
          },
          visible: rect.width > 0 && rect.height > 0,
          // 尝试获取更多位置信息
          offsetLeft: img.offsetLeft,
          offsetTop: img.offsetTop,
          // 检查父元素的data属性，可能包含顺序信息
          parentData: {
            index: img.parentElement?.getAttribute('data-index'),
            swiper: img.parentElement?.getAttribute('data-swiper-slide-index'),
            slide: img.closest('[data-slide-index]')?.getAttribute('data-slide-index')
          }
        });
      }
    });
    
    // 尝试多种排序策略
    const domOrder = [...imageInfos];
    
    // 按水平位置排序（左到右）
    const positionOrder = [...imageInfos].sort((a, b) => {
      const aLeft = a.position.left;
      const bLeft = b.position.left;
      
      // 首先按垂直位置分组
      if (Math.abs(a.position.top - b.position.top) > 50) {
        return a.position.top - b.position.top;
      }
      
      // 对于轮播图，处理循环显示的情况
      const threshold = -200;
      
      if (aLeft < threshold && bLeft > threshold) {
        return 1;
      }
      if (bLeft < threshold && aLeft > threshold) {
        return -1;
      }
      
      return aLeft - bLeft;
    });
    
    // 按swiper-slide-index排序（如果存在）
    const swiperOrder = [...imageInfos].sort((a, b) => {
      const aIndex = parseInt(a.parentData.swiper) || parseInt(a.parentData.slide) || parseInt(a.parentData.index) || a.index;
      const bIndex = parseInt(b.parentData.swiper) || parseInt(b.parentData.slide) || parseInt(b.parentData.index) || b.index;
      return aIndex - bIndex;
    });
    
    // 调整DOM顺序（第一个移到最后）
    const adjustedDomOrder = [...imageInfos];
    if (adjustedDomOrder.length > 1) {
      const first = adjustedDomOrder.shift();
      adjustedDomOrder.push(first);
    }

    // 选择最佳排序策略
    let finalOrder;
    if (swiperOrder.some(info => info.parentData.swiper || info.parentData.slide)) {
      finalOrder = swiperOrder;
    } else {
      finalOrder = adjustedDomOrder;
    }
    
    // 去重并添加到结果数组
    const processedUrls = [];
    finalOrder.forEach((info) => {
      if (!processedUrls.includes(info.src)) {
        images.push(info.src);
        processedUrls.push(info.src);
      }
    });
  }
  
  // 如果没有找到slider图片，尝试备用方案
  if (images.length === 0) {
    const backupSelectors = [
      '.swiper-container img',
      '.swiper-slide img',
      '.carousel img',
      '.note-detail img'
    ];
    
    for (const selector of backupSelectors) {
      const imgs = document.querySelectorAll(selector);
      
      if (imgs.length > 0) {
        const processedUrls = [];
        
        imgs.forEach((img, index) => {
          if (isMainImage(img)) {
            const src = processImageSrc(img);
            if (src && !processedUrls.includes(src)) {
              images.push(src);
              processedUrls.push(src);
            }
          }
        });
        
        if (images.length > 0) {
          break;
        }
      }
    }
  }

  // 最后的通用搜索作为最终备用方案
  if (images.length === 0) {
    const allImages = document.querySelectorAll('img');
    const processedUrls = [];
    
    allImages.forEach(img => {
      if (isMainImage(img)) {
        const src = processImageSrc(img);
        if (src && src.includes('xiaohongshu') && !processedUrls.includes(src)) {
          images.push(src);
          processedUrls.push(src);
        }
      }
    });
  }
  return images; // 移除数量限制，返回所有图片
}

// 判断是否为主要图片（过滤掉表情包等小图标）
function isMainImage(img) {
  // 检查图片尺寸
  const rect = img.getBoundingClientRect();
  const naturalWidth = img.naturalWidth || img.width || rect.width;
  const naturalHeight = img.naturalHeight || img.height || rect.height;
  
  if (naturalWidth < 50 || naturalHeight < 50) {
    return false;
  }
  
  const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '';
  if (src.includes('emoji') || src.includes('icon') || src.includes('avatar') || src.includes('sticker')) {
    return false;
  }
  
  const parentClasses = img.parentElement?.className?.toLowerCase() || '';
  if (parentClasses.includes('emoji') || parentClasses.includes('sticker') || parentClasses.includes('icon')) {
    return false;
  }
  
  return true;
}

// 处理图片URL
function processImageSrc(img) {
  let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
  
  if (!src) {
    return null;
  }
  
  const isXhsImage = src.includes('sns-img') || 
                    src.includes('ci.xiaohongshu.com') || 
                    src.includes('xiaohongshu') ||
                    src.includes('xhscdn.com');
  
  if (!isXhsImage) {
    return null;
  }
  
  if (!src.startsWith('http')) {
    src = 'https:' + src;
  }
  
  src = src.replace(/\?.*$/, '');
  
  return src;
}

function extractTags() {
  const tags = [];
  const selectors = [
    '.tag',
    '[class*="tag"]',
    '.hashtag',
    '.topic'
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const text = element.textContent.trim();
      if (text && text.startsWith('#')) {
        const tag = text.replace('#', '');
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }
    });
  }

  const contentText = extractContent();
  const hashtagRegex = /#([^#\s]+)/g;
  let match;
  while ((match = hashtagRegex.exec(contentText)) !== null) {
    if (!tags.includes(match[1])) {
      tags.push(match[1]);
    }
  }

  return tags;
}