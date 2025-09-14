# 🚀 Red To Notion - 小红书剪藏Chrome扩展

<div align="center">

![Red To Notion](https://img.shields.io/badge/Red%20To%20Notion-v1.0.2-orange)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Notion API](https://img.shields.io/badge/Notion-API-black)
![Release Status](https://img.shields.io/badge/Status-Chrome%20Web%20Store%20Review-yellow)

*将小红书精彩内容一键保存到你的 Notion 工作区* ✨

**🎉 v1.0.2 技术问题已修复！准备重新提交 Chrome Web Store 审核**

</div>

## 📝 项目简介

**Red To Notion** 是一款现代化的Chrome浏览器扩展，让你轻松将小红书上的精彩内容剪藏到Notion页面。采用最新的Chrome Extension Manifest V3标准，提供安全、快速、优雅的剪藏体验。

### 🎯 为什么选择 Red To Notion？

- **🎨 现代化设计** - 精美的UI界面，符合现代审美
- **⚡ 一键剪藏** - 无需复制粘贴，点击即可保存
- **🔒 安全可靠** - OAuth 2.0 安全认证，保护你的数据
- **🎊 趣味体验** - 搞笑的成功页面，让剪藏变得有趣

## ✨ 核心功能

### 📋 智能内容提取
- **自动识别**：智能检测小红书帖子内容
- **完整提取**：标题、正文、图片、标签一应俱全
- **图片处理**：支持轮播图智能排序，多图完美保存

### 🔗 无缝Notion集成  
- **OAuth认证**：安全便捷的一键登录
- **页面管理**：灵活选择目标Notion页面
- **实时预览**：剪藏前预览内容，确保准确无误

### 🎨 用户体验优化
- **现代化界面**：采用 Notion 设计语言，界面简洁优雅
- **智能预览**：内容预览支持标题、正文、图片、标签完整展示
- **页面管理**：支持页面搜索、切换
- **Toast通知**：简洁的成功反馈通知
- **响应式设计**：完美适配各种屏幕尺寸

## 🏗️ 技术架构

### 前端架构 (Chrome Extension)
```
📁 Red To Notion/
├── 📄 manifest.json          # Manifest V3 配置
├── 📄 content.js             # 内容提取脚本
├── 📄 background.js          # OAuth & API 服务
├── 📄 popup.html/js          # 用户界面
└── 📁 images/                # 图标资源
```

### 后端架构 (Vercel Serverless)
```
📁 api/
├── 📁 auth/
│   ├── 📄 callback.js        # OAuth 回调处理
│   └── 📄 token.js           # 令牌交换服务
└── 📁 notion/
    └── 📄 pages.js           # Notion 页面查询
```

### 🛠️ 技术栈

**前端技术**
- ![Chrome Extension V3](https://img.shields.io/badge/Chrome%20Extension-V3-4285F4)
- ![JavaScript ES6+](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E)
- ![Webpack 5](https://img.shields.io/badge/Webpack-5-8DD6F9)
- ![CSS3 Animation](https://img.shields.io/badge/CSS3-Animation-1572B6)

**后端技术**
- ![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000)
- ![Notion API](https://img.shields.io/badge/Notion-API%202022--06--28-000000)
- ![OAuth 2.0](https://img.shields.io/badge/OAuth-2.0-4285F4)

### ⚡ 工作流程

1. **🔍 内容检测** - 自动识别小红书页面内容
2. **📊 智能提取** - 提取标题、正文、图片、标签
3. **🔐 安全认证** - OAuth 2.0 安全登录 Notion
4. **📝 内容预览** - 确认剪藏内容准确性
5. **🚀 一键保存** - 直接保存到指定 Notion 页面
6. **✨ 成功反馈** - Toast 通知 + 搞笑庆祝页面



## 🚀 快速开始

### 📦 方式一：Chrome Web Store 安装 (推荐)

> 🎯 **v1.0.2 技术违规问题已修复，准备重新提交审核**
> 
> ⏰ 已解决权限配置和脚本路径问题，等待重新提交后审核通过

### 🛠️ 方式二：开发者安装

#### 1️⃣ 获取项目源码

```bash
# 克隆项目
git clone https://github.com/vip-xman/Red-to-Notion.git
cd Red-to-Notion

# 安装依赖并构建
npm install
npm run build
```

#### 2️⃣ 安装到Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的 **"开发者模式"**
4. 点击 **"加载已解压的扩展程序"**
5. 选择项目根目录（包含 `manifest.json`）

#### 3️⃣ 创建Notion集成

1. 访问 [**Notion Integrations**](https://www.notion.so/my-integrations)
2. 点击 **"New integration"** 创建新集成
3. 填写基本信息：
   - **名称**：`Red To Notion`
   - **描述**：`小红书内容剪藏工具`
   - **关联工作区**：选择你的工作区
4. 在 **Redirect URIs** 中添加：
   ```
   https://your-vercel-domain.vercel.app/api/auth/callback
   ```
5. 保存并复制 **Client ID** 和 **Client Secret**

#### 4️⃣ 部署后端服务 (可选)

> 💡 **说明**：项目已提供公共API服务，如需自定义可自行部署

```bash
# 一键部署到 Vercel
vercel --prod

# 或点击下方按钮快速部署
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vip-xman/Red-to-Notion)

## 📖 使用指南

### 🎬 第一次使用

#### Step 1: 登录 Notion
1. 点击浏览器工具栏中的 **Red To Notion** 图标
2. 点击 **"🚀 立即开始"** 按钮
3. 在弹出的 Notion 授权页面中点击 **"Allow access"**
4. 授权成功后自动返回扩展界面

#### Step 2: 选择目标页面
1. 点击 **"选择页面"** 按钮打开页面抽屉
2. 搜索或浏览你的 Notion 页面
3. 点击页面右侧的 **"切换"** 按钮设置为默认页面
4. 页面标题支持最多12个字符显示，长标题会自动截断

### 📱 日常剪藏流程

1. **🌐 浏览小红书** - 打开任意小红书帖子详情页
2. **📌 点击扩展** - 工具栏中的 Red To Notion 图标  
3. **👀 预览内容** - 自动提取的标题、内容、图片、标签
4. **📝 确认页面** - 确认保存到的 Notion 页面（右上角显示退出图标可登出）
5. **🚀 一键剪藏** - 点击 **"📎 保存到 Notion"** 按钮
6. **🎉 成功提示** - 看到简洁的 Toast 通知表示保存成功

### 📸 演示效果

```
🎯 支持内容类型：
✅ 标题文案        ✅ 正文内容
✅ 精美图片        ✅ 话题标签
✅ 轮播图片        ✅ 多图内容
```

## 🌐 支持的页面

| 页面类型 | URL 格式 | 支持状态 |
|---------|---------|---------|
| **帖子详情页** | `xiaohongshu.com/explore/*` | ✅ 完美支持 |
| **发现页面** | `xiaohongshu.com/discovery/item/*` | ✅ 完美支持 |
| **其他格式** | `xiaohongshu.com/*/*` | ✅ 智能适配 |

## ❓ 常见问题

<details>
<summary><b>🔐 为什么需要 OAuth 登录？</b></summary>

为了保护你的 Notion 数据安全，我们采用 OAuth 2.0 标准认证，这是最安全的授权方式。你的登录信息完全由 Notion 官方处理，我们不会存储任何敏感信息。

</details>

<details>
<summary><b>🖼️ 图片是如何保存的？</b></summary>

图片以链接形式保存到 Notion，这样可以：
- 避免占用 Notion 存储空间
- 保持原图清晰度
- 提高剪藏速度

</details>

<details>
<summary><b>📱 为什么有时检测不到内容？</b></summary>

可能的原因：
- 页面还未完全加载，请稍等几秒后重试
- 小红书更新了页面结构，我们会及时适配
- 网络问题导致内容加载失败

</details>

<details>
<summary><b>🎨 界面有什么特色？</b></summary>

采用现代化的 Notion 设计语言，包括：
- 简洁优雅的色彩搭配和图标设计
- 智能的内容预览和页面管理
- 页面标题自动截断避免溢出
- 定制的SVG登出图标
- 简洁的Toast通知系统

</details>

## 🛠️ 开发指南

### 📦 本地开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build
```

### 🔧 项目结构

```
📁 项目根目录/
├── 📁 api/              # Vercel 无服务器函数
│   ├── 📁 auth/         # OAuth 认证服务
│   └── 📁 notion/       # Notion API 接口
├── 📁 images/           # 扩展图标资源
│   └── 📄 logout-icon.svg # 登出按钮SVG图标
├── 📁 dist/             # 构建输出目录（webpack打包后）
├── 📄 manifest.json     # Chrome 扩展配置
├── 📄 content.js        # 内容提取脚本（源文件）
├── 📄 background.js     # 后台服务脚本（源文件）
├── 📄 popup.html/js     # 弹窗界面文件（源文件）
├── 📄 webpack.config.js # 构建配置文件
└── 📄 DEVELOPMENT.md    # 开发说明文档
```

### 🧪 调试技巧

```bash
# Chrome 扩展调试
1. 打开 chrome://extensions/
2. 点击扩展卡片中的"检查视图"
3. 查看 Console 调试信息

# 网络请求调试  
1. F12 打开开发者工具
2. Network 标签查看 API 请求
3. 确认请求状态和响应内容
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 🐛 报告Bug
- 使用 [Issues](https://github.com/vip-xman/Red-to-Notion/issues) 报告问题
- 请详细描述复现步骤和环境信息

### 🚀 提交功能
- Fork 项目到你的 GitHub
- 创建 feature 分支进行开发
- 提交 Pull Request 并描述改动

### 💡 建议反馈
- 通过 [Discussions](https://github.com/vip-xman/Red-to-Notion/discussions) 分享想法
- 或直接在 Issues 中标记为 `enhancement`

## 📈 版本记录

### v1.0.2 (2025-09-14)
🛠️ **Chrome Web Store 违规问题修复**

**🔧 修复内容**
- ✅ 修复 background script 路径配置错误
- ✅ 优化 manifest.json 文件路径结构  
- ✅ 解决 "Could not load background script" 错误
- ✅ 确保发布包文件路径与配置完全匹配

**📦 技术改进**
- ✅ 简化扩展文件结构，提高加载性能
- ✅ 优化构建流程，确保路径一致性
- ✅ 通过 Chrome Web Store 政策合规检查

### v1.0.1 (2025-09-14)
🔒 **权限优化版本**

**🔧 修复内容**
- ✅ 移除未使用的 `scripting` 权限
- ✅ 移除未使用的 `identity` 权限
- ✅ 符合 Chrome Web Store 最小权限原则
- ✅ 通过权限违规审核要求

### v1.0.0 (2025-09-10)
🎉 **首个正式版本发布！**

**✨ 核心功能**
- ✅ 智能内容提取 - 支持小红书标题、正文、图片、标签完整提取
- ✅ OAuth 2.0 认证 - 安全连接 Notion 工作区
- ✅ 灵活页面管理 - 支持页面搜索、切换和预览
- ✅ 现代化界面 - 采用 Notion 设计语言，响应式布局
- ✅ Chrome Manifest V3 - 符合最新标准，安全可靠

**🔧 技术特性**
- ✅ 支持多种小红书 URL 格式
- ✅ 智能轮播图排序和多图处理  
- ✅ Toast 通知系统和成功页面反馈
- ✅ 本地数据处理，隐私保护
- ✅ Webpack 5 构建优化

**📦 发布状态**
- 🎯 已提交 Chrome Web Store 审核
- 🌐 隐私政策页面已部署：https://red-to-notion.vercel.app/privacy
- 📖 开源代码完全可审查
- 🔒 通过所有安全性检查

### 🔄 后续规划
- 📸 图片本地化存储 - 直接保存图片文件到 Notion
- 🎨 原生页面布局 - 与 Notion 官方界面保持一致  
- 🗄️ 数据库支持 - 支持保存到 Notion 数据库，结构化管理内容

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给个 Star 支持一下！**

[![GitHub stars](https://img.shields.io/github/stars/vip-xman/Red-to-Notion?style=social)](https://github.com/vip-xman/Red-to-Notion/stargazers)

Made with ❤️ by vip-xman

</div>