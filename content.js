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
  console.log('Extracting content from URL:', url);
  
  // 检查是否为详情页
  const isDetailPage = url.includes('/explore/') && url.length > url.indexOf('/explore/') + 20;
  
  // 支持多种小红书URL格式
  const isXiaohongshuPost = url.includes('xiaohongshu.com/explore/') || 
                           url.includes('xiaohongshu.com/discovery/item/') ||
                           url.match(/xiaohongshu\.com\/\w+\/\w+/);
  
  if (!isXiaohongshuPost) {
    throw new Error('请打开一个图文帖，再使用扩展');
  }
  
  console.log('Is detail page:', isDetailPage);

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

  // 有些渠道（如document.title兜底）会把正文本身当标题返回，
  // 这种情况和"没有标题"本质一样，都需要改用正文开头几个字
  const isTitleActuallyContent = data.title && data.content &&
    (data.content.startsWith(data.title) || data.title.startsWith(data.content));

  if ((!data.title || isTitleActuallyContent) && data.content) {
    const firstLine = data.content.split('\n')[0].trim();
    data.title = firstLine.length > 10 ? firstLine.substring(0, 10) + '...' : firstLine;
  }

  return data;
}

function extractTitle() {
  console.log('=== 标题提取开始 ===');
  
  // 首先尝试找到当前活跃的帖子容器
  const containerSelectors = [
    '.note-detail-mask',    // 弹窗模态框
    '.note-detail',         // 详情页容器
    '.modal-content',       // 通用模态框
    '.popup-content'        // 弹窗内容
  ];

  let activeContainer = null;
  for (const containerSelector of containerSelectors) {
    const container = document.querySelector(containerSelector);
    if (container) {
      console.log(`找到活跃容器: ${containerSelector}`);
      activeContainer = container;
      break;
    }
  }

  // 在容器内或整个文档中搜索标题
  const searchContext = activeContainer || document;
  console.log(`搜索范围: ${activeContainer ? '活跃容器' : '整个文档'}`);

  // 优先级排序的选择器
  const titleSelectors = [
    '.note-title',          // 最具体的标题选择器
    '[class*="note-title"]', // 包含note-title的class
    'h1',                   // 标准标题元素
    '.title',              // 通用标题class
    '[class*="title"]'     // 包含title的class
  ];

  // 需要过滤的UI文本（这些是页面上固定的推荐模块/面板标题，不是帖子标题）
  const uiFilters = [
    '温馨提示', '提示', '小红书', 'Xiaohongshu',
    '登录', '注册', '关注', '点赞', '评论', '分享', '收藏',
    '更多', '查看更多', '展开', '收起',
    'App', '下载', '立即下载', '打开App', '去App查看',
    '猜你想搜', '活动'
  ];

  console.log('开始遍历选择器...');
  for (const selector of titleSelectors) {
    console.log(`\n检查选择器: ${selector}`);
    
    const elements = searchContext.querySelectorAll(selector);
    console.log(`找到 ${elements.length} 个匹配元素`);
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const text = element.textContent.trim();
      
      console.log(`  元素 ${i + 1}: "${text}"`);
      console.log(`  元素位置: ${element.getBoundingClientRect().left}, ${element.getBoundingClientRect().top}`);
      console.log(`  父元素class: ${element.parentElement?.className || 'none'}`);
      
      if (!text) {
        console.log('  → 跳过: 内容为空');
        continue;
      }
      
      if (uiFilters.includes(text)) {
        console.log('  → 跳过: 匹配UI过滤器');
        continue;
      }
      
      if (text.length < 2 || text.length > 200) {
        console.log(`  → 跳过: 长度不合理 (${text.length} 字符)`);
        continue;
      }
      
      // 检查是否来自其他帖子
      const isFromFeedItem = element.closest('.note-item') &&
                           !element.closest('.note-detail') &&
                           !element.closest('.note-detail-mask');

      if (isFromFeedItem) {
        console.log('  → 跳过: 来自feed列表中的其他帖子');
        continue;
      }

      // "猜你想搜"等推荐胶囊组件会插在正文里，内容随笔记变化，无法靠文本黑名单过滤，只能按容器排除
      if (element.closest('[class*="xhs-capsule-widget"]')) {
        console.log('  → 跳过: 来自猜你想搜等推荐胶囊组件');
        continue;
      }

      console.log(`  ✓ 找到有效标题: "${text}"`);
      console.log('=== 标题提取完成 ===');
      return text;
    }
  }

  // 尝试meta标签
  console.log('\n检查meta标签...');
  const metaTitle = document.querySelector('meta[property="og:title"]');
  if (metaTitle && metaTitle.content.trim()) {
    const title = metaTitle.content.trim();
    console.log(`Meta标题: "${title}"`);
    
    if (!uiFilters.includes(title) && 
        title !== '小红书' && 
        !title.includes('小红书') &&
        title.length > 1 && 
        title.length < 200) {
      console.log('✓ 使用Meta标题');
      console.log('=== 标题提取完成 ===');
      return title;
    } else {
      console.log('→ Meta标题被过滤');
    }
  }

  // 尝试document.title，但要严格验证
  console.log('\n检查document.title...');
  const docTitle = document.title.replace(' - 小红书', '').replace('小红书 - ', '').trim();
  if (docTitle && docTitle !== '小红书' && !uiFilters.includes(docTitle)) {
    console.log(`Document标题: "${docTitle}"`);
    
    // 严格验证document.title是否为真正的标题
    const isTitleLike = docTitle.length <= 50;  // 标题通常不超过50字符
    
    if (isTitleLike) {
      console.log('✓ Document标题符合标题格式，使用');
      console.log('=== 标题提取完成 ===');
      return docTitle;
    } else {
      console.log(`→ Document标题被过滤: 长度${docTitle.length}字符，超过50字符限制`);
    }
  }

  console.log('未找到有效标题，返回空字符串');
  console.log('=== 标题提取完成 ===');
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

// 视频帖没有图集，可视内容是视频本身；其详情页DOM里没有swiper轮播和常规图片容器，
// 会导致extractImages()的兜底逻辑退化成全局搜索<img>，把评论区/直播通知栏等浮层里的
// 表情图标当成正文配图抓取进来，因此视频帖直接跳过图片提取
function isVideoNote() {
  return !!document.querySelector('.note-detail video, .note-content video, video');
}

function extractImages() {
  if (isVideoNote()) {
    return [];
  }

  const images = [];

  // 小红书轮播用Swiper实现，loop模式下DOM里会克隆首尾slide用于无缝循环，
  // 真实顺序由.swiper-slide上的data-swiper-slide-index决定，不能依赖DOM顺序
  const slides = document.querySelectorAll('.swiper-slide[data-swiper-slide-index]');

  if (slides.length > 0) {
    const slideInfos = Array.from(slides).map(slide => {
      const innerImg = slide.querySelector('img');
      return {
        slideIndex: parseInt(slide.getAttribute('data-swiper-slide-index'), 10),
        src: innerImg ? processImageSrc(innerImg) : null
      };
    }).filter(info => info.src && !Number.isNaN(info.slideIndex));

    slideInfos.sort((a, b) => a.slideIndex - b.slideIndex);

    const seenIndexes = new Set();
    slideInfos.forEach(info => {
      // loop模式下同一张图会被克隆出重复的slideIndex，去重
      if (!seenIndexes.has(info.slideIndex)) {
        images.push(info.src);
        seenIndexes.add(info.slideIndex);
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