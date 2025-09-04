# 🚀 Red To Notion - 小红书剪藏Chrome扩展

<div align="center">

![Red To Notion](https://img.shields.io/badge/Red%20To%20Notion-v1.0.0-orange)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Notion API](https://img.shields.io/badge/Notion-API-black)

*将小红书精彩内容一键保存到你的 Notion 工作区* ✨

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
- **Toast通知**：剪藏成功即时反馈
- **响应式设计**：完美适配各种屏幕尺寸  
- **搞笑风格**：幽默的成功页面让使用更有趣

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

### 📦 方式一：直接安装 (推荐)

> 🎯 **即将上架 Chrome Web Store，敬请期待！**

### 🛠️ 方式二：开发者安装

#### 1️⃣ 获取项目源码

```bash
# 克隆项目
git clone https://github.com/your-username/red-to-notion.git
cd red-to-notion

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/red-to-notion)

## 📖 使用指南

### 🎬 第一次使用

#### Step 1: 登录 Notion
1. 点击浏览器工具栏中的 **Red To Notion** 图标
2. 点击右上角的 **"登录"** 按钮
3. 在弹出的授权页面中点击 **"Allow access"**
4. 看到搞笑的成功页面后，关闭窗口回到扩展

#### Step 2: 选择目标页面
1. 点击 **"⚙️"** 打开页面管理
2. 搜索并添加你想要保存内容的 Notion 页面
3. 设置为默认页面

### 📱 日常剪藏流程

1. **🌐 浏览小红书** - 打开任意小红书帖子详情页
2. **📌 点击扩展** - 工具栏中的 Red To Notion 图标  
3. **👀 预览内容** - 确认提取的标题、内容、图片
4. **🚀 一键剪藏** - 点击 **"剪藏到 Notion"** 按钮
5. **🎉 成功提示** - 看到 Toast 通知表示保存成功

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
<summary><b>🎉 那个搞笑页面是干什么的？</b></summary>

这是我们的特色功能！OAuth 登录成功后会显示一个幽默的庆祝页面，让原本枯燥的技术流程变得有趣。当然，如果你不喜欢，可以直接关闭 😄

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
├── 📁 dist/             # 构建输出目录
├── 📄 manifest.json     # Chrome 扩展配置
├── 📄 content.js        # 内容提取脚本
├── 📄 background.js     # 后台服务脚本
├── 📄 popup.html/js     # 弹窗界面文件
└── 📄 webpack.config.js # 构建配置文件
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
- 使用 [Issues](https://github.com/your-username/red-to-notion/issues) 报告问题
- 请详细描述复现步骤和环境信息

### 🚀 提交功能
- Fork 项目到你的 GitHub
- 创建 feature 分支进行开发
- 提交 Pull Request 并描述改动

### 💡 建议反馈
- 通过 [Discussions](https://github.com/your-username/red-to-notion/discussions) 分享想法
- 或直接在 Issues 中标记为 `enhancement`

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给个 Star 支持一下！**

Made with ❤️ by [Your Name]

</div>