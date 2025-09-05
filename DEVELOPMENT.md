# Red To Notion - 开发说明

## 项目结构

这个Chrome扩展使用webpack构建系统来管理源代码和生产版本。

### 文件组织

**源文件（开发时修改这些文件）：**
- `content.js` - 内容脚本，负责从小红书页面提取帖子数据
- `background.js` - 后台脚本，处理OAuth认证和Notion API调用
- `popup.js` - 弹窗脚本，处理用户界面逻辑
- `popup.html` - 弹窗HTML，定义用户界面结构

**构建文件（自动生成，不要直接修改）：**
- `dist/content.js` - 压缩后的内容脚本
- `dist/background.js` - 压缩后的后台脚本
- `dist/popup.js` - 压缩后的弹窗脚本

### 开发流程

1. **修改源文件**：编辑根目录下的 `.js` 和 `.html` 文件
2. **构建项目**：运行 `npm run build` 生成dist文件
3. **重新加载扩展**：在Chrome扩展管理页面重新加载扩展
4. **测试功能**：在小红书页面测试扩展功能

### 重要提醒

- ⚠️ **永远不要直接修改 `dist/` 目录下的文件**
- ⚠️ **每次修改源文件后都要运行 `npm run build`**
- ⚠️ **构建后要重新加载Chrome扩展**

### 常用命令

```bash
# 开发模式构建（带监听）
npm run dev

# 生产模式构建
npm run build
```

### 调试技巧

1. **内容脚本调试**：在小红书页面按F12，查看Console
2. **弹窗脚本调试**：右键点击扩展图标 → "检查" → Console
3. **后台脚本调试**：在 `chrome://extensions/` 点击扩展的"service worker"

## 最近更新

- 修复了标题提取的跨帖子污染问题
- 改进了内容预览的显示逻辑
- 移除了展开按钮，简化了用户界面