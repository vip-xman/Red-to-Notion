# 小红书剪藏Chrome扩展开发 Todo

## ✅ 已完成任务（MVP版本）

1. **创建Chrome扩展基本结构** - manifest.json, popup.html, content script
2. **分析小红书网页版DOM结构**，确定帖子标题、内容、图片的选择器
3. **开发内容提取模块** - 提取帖子标题、正文内容和图片URL
4. **集成Notion API** - 设置认证，获取用户授权
5. **开发Notion数据库操作** - 创建页面，插入帖子内容和图片
6. **设计扩展UI界面** - popup页面，显示提取的内容预览
7. **添加用户设置功能** - Notion token配置，目标页面选择
8. **实现错误处理和用户反馈机制**
9. **基本功能测试完成**

## 🚀 新功能开发 - OAuth授权与页面选择

### 阶段一：技术准备和配置

**1. 更新项目配置**
- [ ] 更新 `manifest.json` 添加 `identity` 权限
- [ ] 配置 OAuth2 客户端ID和重定向URI
- [ ] 添加必要的权限：`identity`, `storage`
- [ ] 研究Notion OAuth应用创建和配置要求

**2. 创建Notion OAuth应用**
- [ ] 在Notion开发者控制台创建OAuth应用
- [ ] 配置redirect URI：`https://<extension-id>.chromiumapp.org/`
- [ ] 获取Client ID和Client Secret
- [ ] 设置合适的OAuth权限范围

### 阶段二：OAuth授权流程实现

**3. OAuth核心功能开发**
- [ ] 实现 `chrome.identity.launchWebAuthFlow` 授权流程
- [ ] 创建授权URL构建函数（包含state防CSRF）
- [ ] 实现授权码与访问令牌交换逻辑
- [ ] 添加token刷新机制
- [ ] 实现安全的token存储（chrome.storage.sync）

**4. 后台服务更新**
- [ ] 更新 `background.js` 处理OAuth相关消息
- [ ] 实现token验证和刷新逻辑
- [ ] 添加OAuth相关错误处理
- [ ] 实现登录状态检查功能

### 阶段三：页面选择功能

**5. Notion页面API集成**
- [ ] 实现Notion Search API调用获取用户页面列表
- [ ] 添加页面权限验证逻辑
- [ ] 实现页面信息缓存机制
- [ ] 处理大量页面的分页加载

**6. 页面选择UI组件**
- [ ] 设计页面选择下拉菜单UI
- [ ] 实现页面搜索和过滤功能
- [ ] 添加页面类型图标和层级显示
- [ ] 实现最近使用页面的快速选择

### 阶段四：用户界面重构

**7. 弹窗界面升级**
- [ ] 重新设计弹窗布局，集成OAuth按钮
- [ ] 添加用户登录状态显示
- [ ] 创建"一键登录Notion"按钮和流程
- [ ] 实现登录/登出状态切换
- [ ] 优化设置面板，移除手动token输入

**8. 用户体验优化**
- [ ] 添加登录流程的加载动画
- [ ] 实现授权成功/失败的用户反馈
- [ ] 添加页面选择的实时预览
- [ ] 优化错误提示和处理流程
- [ ] 实现离线状态处理

### 阶段五：数据迁移和兼容性

**9. 向后兼容性**
- [ ] 实现从手动token到OAuth的平滑迁移
- [ ] 保留手动配置选项作为备选方案
- [ ] 添加配置方式选择界面
- [ ] 实现配置数据的版本管理

**10. 数据存储优化**
- [ ] 重构设置存储结构支持新功能
- [ ] 实现用户配置的加密存储
- [ ] 添加配置备份和恢复功能
- [ ] 优化存储空间使用

### 阶段六：测试和优化

**11. 功能测试**
- [ ] OAuth授权流程完整测试
- [ ] 页面选择功能测试
- [ ] 不同权限场景测试
- [ ] 网络异常情况测试
- [ ] 多账户切换测试

**12. 安全性和性能优化**
- [ ] OAuth流程安全性审核
- [ ] token泄露风险评估
- [ ] API调用频率优化
- [ ] 内存使用优化
- [ ] 错误日志和监控实现

## 🔧 技术实现要点

### OAuth安全最佳实践
- 使用 `chrome.identity.getRedirectURL()` 获取正确的redirect URI
- 实现CSRF防护（state参数验证）
- 安全存储access token和refresh token
- 实现token过期自动刷新

### Notion API集成
- 使用Notion Search API: `POST https://api.notion.com/v1/search`
- 实现页面类型过滤（page类型）
- 处理API速率限制
- 实现优雅的错误处理

### Chrome扩展架构
- 分离OAuth逻辑到background script
- popup script专注UI交互
- content script保持现有功能
- 使用消息传递进行组件通信

## 📋 验收标准

- [ ] 用户可以通过"一键登录"完成Notion授权
- [ ] 授权后能看到自己有权限的页面列表
- [ ] 可以搜索和选择目标页面
- [ ] 选中页面后能正常保存小红书内容
- [ ] 支持多账户管理和切换
- [ ] 向后兼容现有手动配置方式
- [ ] 所有OAuth流程符合安全最佳实践

## 项目说明

本扩展旨在支持将小红书网页版帖子一键收藏到Notion，包含以下核心功能：
- 提取帖子标题
- 提取帖子正文内容  
- 提取帖子中的所有图片
- 整合内容并保存到Notion数据库

## 开发需求记录

### Notion数据库配置
- 目标数据库：用户可配置
- 字段结构：标题、内容、图片、标签

### 功能需求  
- 图片处理：上传到Notion
- 触发方式：点击扩展图标
- 开发环境：Node.js可用

### 测试链接

示例小红书帖子：
```
https://www.xiaohongshu.com/explore/66128b20000000000401be91?xsec_token=ABVwupKcSR003a2nBqDC-7ioPrw6YGS-cWU1dNUUd0-sU=&xsec_source=pc_search&source=web_explore_feed
```