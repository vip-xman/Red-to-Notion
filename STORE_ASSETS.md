# Chrome Web Store 资源准备指南

## 📱 必需的图标资源

### 基础图标 (已有)
- ✅ **16x16px** - `images/icon-16.png` - 扩展图标 (小)
- ✅ **32x32px** - `images/icon-32.png` - 扩展图标 (中)  
- ✅ **48x48px** - `images/icon-48.png` - 扩展管理页面
- ✅ **128x128px** - `images/icon-128.png` - Chrome Web Store

### 需要新增的商店资源

#### 宣传图片 (Promotional Images)
1. **📸 宣传横图 - 440x280px** 🔴 必需
   - 文件名：`store/promotional-440x280.png`
   - 用途：Chrome Web Store 商店页面主图
   - 设计要求：
     - 清晰展示应用功能
     - 包含应用名称 "Red To Notion"
     - 体现小红书到Notion的转换概念
     - 使用Notion品牌色调 (#000000, #F7F6F3)

2. **📱 小尺寸宣传图 - 220x140px** (可选)
   - 文件名：`store/promotional-220x140.png`
   - 用途：某些展示位置的缩略图

#### 截图 (Screenshots) 🔴 必需
**至少3张，最多5张截图，展示扩展功能：**

1. **欢迎登录页面** - `store/screenshot-1-welcome.png`
   - 尺寸：1280x800px 或 640x400px
   - 内容：显示扩展的欢迎界面和"立即开始"按钮

2. **内容预览页面** - `store/screenshot-2-preview.png` 
   - 尺寸：1280x800px 或 640x400px
   - 内容：展示小红书内容的智能提取和预览

3. **页面选择功能** - `store/screenshot-3-pages.png`
   - 尺寸：1280x800px 或 640x400px  
   - 内容：显示Notion页面选择器抽屉

4. **成功保存页面** - `store/screenshot-4-success.png`
   - 尺寸：1280x800px 或 640x400px
   - 内容：展示保存成功的反馈页面

5. **Notion中的效果** - `store/screenshot-5-notion.png` (可选)
   - 尺寸：1280x800px 或 640x400px
   - 内容：展示内容在Notion中的最终效果

## 🎨 设计规范

### 色彩方案
```css
/* 主色调 - Notion 风格 */
--primary-black: #0F0F0F
--background-light: #F7F6F3  
--accent-orange: #FF6B35
--text-gray: #8B949E
--success-green: #0F7B0F
```

### 视觉元素
- **Logo**: 结合红书📚和Notion📝的概念
- **字体**: -apple-system, BlinkMacSystemFont, "Segoe UI"
- **风格**: 简洁现代，符合Notion设计语言
- **图标**: 使用简洁的线条图标风格

### 宣传图设计要点
1. **清晰的价值主张**："一键保存小红书内容到Notion"
2. **功能展示**：展示从小红书到Notion的转换流程
3. **品牌一致性**：与扩展界面设计保持一致
4. **吸引力**：使用鲜明对比和清晰的视觉层次

## 🛠️ 制作工具推荐

### 在线工具
- **Figma**: 矢量设计，支持团队协作
- **Canva**: 模板丰富，适合快速制作
- **Sketch**: Mac专用，设计师首选

### 本地软件
- **Photoshop**: 专业级图像处理
- **GIMP**: 免费开源替代方案
- **Affinity Designer**: 性价比高的矢量设计工具

## 📋 资源检查清单

### 必需资源 🔴
- [ ] 宣传横图 440x280px
- [ ] 至少3张功能截图 
- [ ] 所有图片优化压缩 (<1MB)
- [ ] 图片格式为PNG或JPG

### 推荐资源 🟡  
- [ ] 小尺寸宣传图 220x140px
- [ ] 5张完整功能截图
- [ ] 视频演示 (可选)
- [ ] 多语言截图 (中英文)

### 技术要求 ✅
- [ ] 图片清晰无模糊
- [ ] 色彩饱和度适中
- [ ] 文字可读性强
- [ ] 品牌元素统一
- [ ] 符合Chrome Web Store政策

## 📝 文件命名规范

```
store/
├── promotional-440x280.png      # 主宣传图
├── promotional-220x140.png      # 小宣传图 (可选)
├── screenshot-1-welcome.png     # 欢迎页面截图
├── screenshot-2-preview.png     # 内容预览截图  
├── screenshot-3-pages.png       # 页面选择截图
├── screenshot-4-success.png     # 成功页面截图
└── screenshot-5-notion.png      # Notion效果截图 (可选)
```

## 🎯 后续步骤

1. **创建store目录**：`mkdir store`
2. **制作宣传图**：使用设计工具创建440x280px宣传图
3. **截取功能截图**：在不同状态下截取扩展界面
4. **优化图片**：压缩文件大小，确保清晰度
5. **检查规范**：确保所有图片符合尺寸和质量要求

---

**💡 提示**: 可以先制作基础的3张截图，上架后根据用户反馈再优化和增加更多资源。