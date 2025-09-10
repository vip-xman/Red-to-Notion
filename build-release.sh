#!/bin/bash

# Chrome Web Store 发布包构建脚本
# Build script for Chrome Web Store release

echo "🚀 开始构建 Chrome Web Store 发布包..."
echo "Building Chrome Web Store release package..."

# 设置变量
RELEASE_DIR="release"
PACKAGE_NAME="red-to-notion-v1.0.0"

# 清理旧的发布目录
echo "🧹 清理旧的发布目录..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/$PACKAGE_NAME"

# 构建项目
echo "🔨 构建项目..."
npm run build

# 复制必需的文件
echo "📦 复制发布文件..."

# 核心文件
cp manifest.json "$RELEASE_DIR/$PACKAGE_NAME/"
cp popup.html "$RELEASE_DIR/$PACKAGE_NAME/"
cp LICENSE "$RELEASE_DIR/$PACKAGE_NAME/"

# 构建后的脚本文件
cp -r dist/ "$RELEASE_DIR/$PACKAGE_NAME/"

# 图标和资源
cp -r images/ "$RELEASE_DIR/$PACKAGE_NAME/"

# 创建发布说明
cat > "$RELEASE_DIR/$PACKAGE_NAME/RELEASE_NOTES.txt" << 'EOF'
Red To Notion v1.0.0 - Chrome Web Store Release

📋 发布内容 Release Contents:
- ✅ 核心扩展功能 Core extension functionality
- ✅ 现代化 UI 设计 Modern UI design  
- ✅ Notion OAuth 集成 Notion OAuth integration
- ✅ 小红书内容提取 Xiaohongshu content extraction
- ✅ 隐私政策 Privacy policy compliance
- ✅ 开源许可证 MIT License

🛡️ 隐私政策 Privacy Policy:
详见 GitHub 项目页面: https://github.com/your-username/red-to-notion

📞 技术支持 Support:
GitHub Issues: https://github.com/your-username/red-to-notion/issues

EOF

# 显示打包内容
echo "📄 发布包内容:"
echo "Release package contents:"
find "$RELEASE_DIR/$PACKAGE_NAME" -type f | sort

# 计算文件大小
echo ""
echo "📊 文件统计 File statistics:"
du -sh "$RELEASE_DIR/$PACKAGE_NAME"
echo "文件总数 Total files: $(find "$RELEASE_DIR/$PACKAGE_NAME" -type f | wc -l)"

# 创建ZIP包
echo ""
echo "🗜️  创建ZIP发布包..."
echo "Creating ZIP release package..."
cd "$RELEASE_DIR"
zip -r "$PACKAGE_NAME.zip" "$PACKAGE_NAME"
cd ..

echo ""
echo "✅ 发布包构建完成! Release package built successfully!"
echo "📁 发布包位置 Package location: $RELEASE_DIR/$PACKAGE_NAME.zip"
echo "📝 下一步: 上传到 Chrome Web Store"
echo "   Next step: Upload to Chrome Web Store"
echo ""
echo "🔍 Chrome Web Store 开发者控制台:"
echo "   https://chrome.google.com/webstore/devconsole/"
echo ""
echo "📋 上传清单 Upload checklist:"
echo "   - [ ] 上传 $PACKAGE_NAME.zip"
echo "   - [ ] 填写商店信息 (使用 STORE_DESCRIPTION.md)"
echo "   - [ ] 上传宣传图片和截图"
echo "   - [ ] 设置隐私政策链接"
echo "   - [ ] 提交审核"