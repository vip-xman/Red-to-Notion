# 小红书剪藏Chrome扩展开发Todo

## 高优先级任务

1. **创建Chrome扩展基本结构** - manifest.json, popup.html, content script
2. **分析小红书网页版DOM结构**，确定帖子标题、内容、图片的选择器
3. **开发内容提取模块** - 提取帖子标题、正文内容和图片URL
4. **集成Notion API** - 设置认证，获取用户授权
5. **开发Notion数据库操作** - 创建页面，插入帖子内容和图片

## 中等优先级任务

6. **设计扩展UI界面** - popup页面，显示提取的内容预览
7. **实现图片处理** - 下载图片并上传到Notion或转换为base64
8. **添加用户设置功能** - Notion token配置，目标数据库选择
9. **实现错误处理和用户反馈机制**
10. **测试扩展功能** - 不同类型的小红书帖子测试

## 低优先级任务

11. **优化性能和用户体验** - 加载状态，成功提示等
12. **打包发布Chrome扩展**

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