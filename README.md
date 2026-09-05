# Red To Notion

将小红书图文帖一键剪藏到 Notion 的 Chrome 扩展。

## 功能

- **智能提取**：自动识别标题、正文、话题标签，多图轮播按真实顺序提取
- **图片真实上传**：图片文件通过 Notion File Upload API 上传，不是外链
- **保存到页面或数据库**：抽屉里以树形结构展示已授权的 Notion 页面/数据库，与工作区层级同步
- **OAuth 登录**：通过 Notion 官方 OAuth 授权，不在扩展里处理密码

## 安装

### 从源码安装（开发者模式）

```bash
git clone https://github.com/vip-xman/Red-to-Notion.git
cd Red-to-Notion
npm install
npm run build
```

1. 打开 `chrome://extensions/`，开启右上角"开发者模式"
2. 点击"加载已解压的扩展程序"，选择项目根目录

## 使用

1. 打开一篇小红书图文帖详情页
2. 点击扩展图标，首次使用需点击"连接 Notion"完成 OAuth 授权（授权时勾选允许访问的页面/数据库）
3. 点击"选择保存位置"，在树形列表里选一个页面或数据库
4. 确认预览内容后点击"保存到 Notion"

### 关于授权范围

Notion 只允许 integration 访问你在授权弹窗里勾选过的页面（及其子页面，会自动继承）。抽屉里看不到某个页面，通常是因为还没授权——可以退出扩展重新登录时勾选，或去 Notion「设置 → 连接」找到 Red To Notion 手动追加。

## 项目结构

```
manifest.json      # Chrome 扩展配置（Manifest V3）
content.js         # 小红书页面内容提取
background.js      # OAuth 流程、Notion API 调用（含图片上传）
popup.html/js      # 弹窗界面
api/               # Vercel 无服务器函数（OAuth token 交换）
```

## 本地开发

```bash
npm run dev    # 监听文件变化，开发模式构建
npm run build  # 生产构建
```

修改 `background.js`/`popup.js`/`content.js` 后，需要在 `chrome://extensions/` 里重新加载扩展；若改动了页面脚本，还需刷新对应的小红书标签页。

## 开源协议

[MIT License](LICENSE)
