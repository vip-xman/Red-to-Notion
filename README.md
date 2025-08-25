# Red To Notion - 小红书剪藏Chrome扩展

一键将小红书帖子内容剪藏到Notion页面的Chrome浏览器扩展。

## ✨ 功能特性

- 🔍 **智能识别** - 自动检测小红书帖子页面
- 📝 **内容提取** - 精准提取帖子标题、正文内容
- 🖼️ **图片处理** - 智能识别和排序多图内容，支持轮播图
- 🏷️ **标签识别** - 自动提取话题标签
- 📄 **页面集成** - 直接添加到指定Notion页面
- 🎨 **用户友好** - 内容预览界面，所见即所得

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

### 技术栈

- **Chrome Extension Manifest V3** - 最新扩展规范
- **Webpack 5** - 模块打包工具
- **Notion API** - 官方API集成
- **原生JavaScript** - 轻量级实现

## 📁 项目结构

```
xiaohongshu-clipper/
├── manifest.json          # Chrome扩展配置文件
├── popup.html            # 扩展弹窗UI界面
├── popup.js             # 弹窗逻辑和用户交互
├── content.js           # 内容脚本，负责页面内容提取
├── background.js        # 后台服务工作者，处理Notion API
├── webpack.config.js    # Webpack打包配置
├── package.json         # 项目依赖和脚本配置
├── images/             # 扩展图标资源
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── dist/              # 构建输出目录
    ├── popup.js
    ├── content.js
    └── background.js
```

### 核心文件说明

- **content.js**: 在小红书页面注入，提取帖子内容、图片和标签
- **popup.js**: 扩展弹窗界面逻辑，处理用户交互和设置管理  
- **background.js**: 后台脚本，负责与Notion API通信
- **manifest.json**: 扩展权限、脚本注入和资源配置

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

[MIT License](LICENSE)