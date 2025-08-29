# Red To Notion - 小红书剪藏Chrome扩展

## 项目概述

  这是一个名为"Red To Notion"的Chrome浏览器扩展，用于将小红书帖子内容一键剪藏到Notion页面。

## ✨ 核心功能
- 智能内容提取：自动识别并提取小红书帖子的标题、正文、图片和标签
- 图片处理：支持轮播图智能排序和多图内容识别
- Notion集成：直接将内容添加到指定的Notion页面
- 用户友好界面：提供内容预览和设置配置

## 技术架构
主要文件结构：
- manifest.json - Chrome扩展配置（Manifest V3）
- content.js - 内容脚本，负责页面内容提取
- background.js - 后台服务，处理Notion API调用
- popup.js/html - 扩展弹窗界面和交互逻辑
- webpack.config.js - 构建配置

技术栈：
- Chrome Extension Manifest V3
- Webpack 5 构建工具
- Notion API (@notionhq/client)
- 原生JavaScript实现

## 工作流程
1. 内容提取 (content.js:18-48)：检测小红书页面，提取标题、内容、图片和标签
2. 图片处理 (content.js:118-261)：智能识别轮播图顺序，过滤无关图片
3. 用户交互 (popup.js:14-116)：显示内容预览，处理用户操作
4. 数据传输 (background.js:10-164)：将提取的内容格式化并发送到Notion API



## 🚀 安装步骤

### 1. 获取扩展文件

```bash
# 克隆项目
git clone [项目地址]
cd xiaohongshu-clipper

# 安装依赖并构建
npm install
npm run build
```

### 2. 配置Notion

#### 创建Notion Integration
1. 访问 [Notion Integrations](https://www.notion.so/my-integrations)
2. 点击"New integration"创建新集成
3. 填写名称（如：Red To Notion）
4. 复制生成的"Internal Integration Token"

#### 准备Notion页面
1. 在Notion中创建一个页面用于存储剪藏内容
2. 复制页面ID（URL中的32位字符串）
3. 在页面设置中，添加你的integration连接

> 💡 **提示**：本扩展直接将内容添加到指定页面，无需创建复杂的数据库结构

### 3. 安装扩展到Chrome

1. 打开Chrome浏览器
2. 地址栏输入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录（包含manifest.json的文件夹）

### 4. 配置扩展

1. 点击浏览器工具栏中的扩展图标
2. 点击"Settings"按钮
3. 填入配置信息：
   - **Notion Integration Token**：步骤2中复制的Token
   - **Page ID**：目标Notion页面的ID
4. 点击"Save Settings"保存

## 📖 使用方法

1. **访问小红书帖子** - 打开任意小红书帖子详情页
2. **点击扩展图标** - 浏览器工具栏中的Red To Notion图标
3. **预览内容** - 确认提取的标题、内容、图片和标签
4. **一键剪藏** - 点击"Clip to Notion"按钮

## 🌐 支持的页面

- ✅ 小红书帖子详情页：`https://www.xiaohongshu.com/explore/*`
- ✅ 小红书发现页面：`https://www.xiaohongshu.com/discovery/item/*`
- ✅ 其他小红书帖子格式

## ⚠️ 注意事项

- 确保Notion Integration Token和Page ID配置正确
- Notion页面需要已连接对应的integration
- 图片以链接形式保存，避免跨域访问限制
- 首次使用前请确保已完成所有配置步骤

## 🛠️ 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（自动监听文件变化）
npm run dev

# 生产构建
npm run build
```

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

[MIT License](LICENSE)