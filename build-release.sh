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
mkdir -p "$RELEASE_DIR"

# 构建项目
echo "🔨 构建项目..."
npm run build

# 复制必需的文件到临时目录
echo "📦 复制发布文件..."
TEMP_DIR="$RELEASE_DIR/temp"
mkdir -p "$TEMP_DIR"

# 核心文件 - 直接复制到根目录
cp manifest.json "$TEMP_DIR/"
cp popup.html "$TEMP_DIR/"

# 构建后的脚本文件 - 复制到根目录
cp dist/background.js "$TEMP_DIR/"
cp dist/content.js "$TEMP_DIR/"
cp dist/popup.js "$TEMP_DIR/"

# 图标和资源 (只复制PNG图标文件)
mkdir -p "$TEMP_DIR/images"
cp images/icon-*.png "$TEMP_DIR/images/"
cp images/logout-icon.svg "$TEMP_DIR/images/"


# 显示打包内容
echo "📄 发布包内容:"
echo "Release package contents:"
find "$TEMP_DIR" -type f | sort

# 计算文件大小
echo ""
echo "📊 文件统计 File statistics:"
du -sh "$TEMP_DIR"
echo "文件总数 Total files: $(find "$TEMP_DIR" -type f | wc -l)"

# 创建ZIP包 - 确保manifest.json在根目录
echo ""
echo "🗜️  创建ZIP发布包..."
echo "Creating ZIP release package..."
cd "$TEMP_DIR"
zip -r "../$PACKAGE_NAME.zip" .
cd ../../

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