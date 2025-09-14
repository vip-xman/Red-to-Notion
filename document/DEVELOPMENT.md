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

### 重要变更提醒 ⚠️

**manifest.json 路径配置已优化**：
- ✅ `background.service_worker`: 现在指向 `background.js`（根目录）
- ✅ `content_scripts.js`: 现在指向 `content.js`（根目录）  
- ✅ 发布包结构：编译文件直接放在根目录，简化路径结构

**构建流程说明**：
1. webpack 将源文件编译到 `dist/` 目录
2. `build-release.sh` 将 `dist/` 中的文件复制到发布包根目录
3. manifest.json 配置指向发布包根目录的文件

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

## 最近重要更新

### v1.0.2 (2025-09-14) - Chrome Web Store 违规修复
- 🔧 修复 background script 路径配置问题
- 🔧 解决发布包文件路径与 manifest.json 不匹配的问题
- 📦 优化扩展文件结构，提高兼容性

### v1.0.1 (2025-09-14) - 权限优化
- 🔒 移除未使用的 scripting 和 identity 权限
- 🔒 符合 Chrome Web Store 最小权限原则
- ✅ 通过权限违规审核要求

### 早期更新
- 修复了标题提取的跨帖子污染问题
- 改进了内容预览的显示逻辑  
- 移除了展开按钮，简化了用户界面

## 故障排除

### Chrome Web Store 发布问题
如果遇到发布被拒的情况：

1. **权限违规**：确保 manifest.json 中只包含实际使用的权限
   - 检查 `permissions` 数组，移除未使用的权限
   - 参考当前配置：`["activeTab", "storage", "tabs"]`

2. **脚本加载失败**：检查 manifest.json 中的文件路径与实际文件位置是否匹配
   - `background.service_worker` 应指向根目录的 `background.js`
   - `content_scripts.js` 应指向根目录的 `content.js`

3. **文件结构**：使用 `./build-release.sh` 确保发布包结构正确
   - 编译文件应在发布包根目录
   - manifest.json 配置路径应与实际文件位置一致

### 本地开发问题

1. **扩展无法加载**：
   - 检查 manifest.json 语法是否正确
   - 确保所有引用的文件都存在

2. **功能异常**：
   - 运行 `npm run build` 重新构建后重新加载扩展
   - 检查浏览器控制台是否有错误信息

3. **OAuth 认证失败**：
   - 确认 Notion 集成配置正确
   - 检查重定向 URI 设置

### 调试步骤

1. **检查构建状态**：
   ```bash
   npm run build
   # 确保 dist/ 目录包含所有编译文件
   ```

2. **验证发布包**：
   ```bash
   ./build-release.sh
   # 检查生成的 zip 文件结构
   ```

3. **测试本地安装**：
   - 在 `chrome://extensions/` 加载解压的扩展程序
   - 测试所有功能是否正常工作