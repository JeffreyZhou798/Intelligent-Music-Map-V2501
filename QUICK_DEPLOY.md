# Quick Deploy Guide - 快速部署指南

## 🚀 Vercel 一键部署（推荐）

### 方法1：通过Vercel Dashboard

1. **访问 Vercel**
   - 打开 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的GitHub仓库
   - 选择 `intelligent-music-map-V25` 文件夹

3. **部署**
   - 点击 "Deploy"
   - 等待2-3分钟
   - 获得部署链接：`https://your-project.vercel.app`

**注意**：本项目使用本地AI（@huggingface/transformers），无需配置任何环境变量或API密钥！

### 方法2：通过Vercel CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 进入项目目录
cd intelligent-music-map-V25

# 登录Vercel
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

## 📦 GitHub Pages 部署

### 前提条件
- 代码已推送到GitHub
- 仓库设置中启用GitHub Pages

### 部署步骤

```bash
cd intelligent-music-map-V25

# 构建并部署
npm run deploy
```

部署后访问：`https://your-username.github.io/your-repo-name/`

## 🧪 本地测试（部署前验证）

### 快速测试

```bash
cd intelligent-music-map-V25
npm install
npm run dev
```

访问：`http://localhost:3000`

### 测试生产构建

```bash
npm run build
npm run preview
```

访问：`http://localhost:4173`

## ✅ 部署检查清单

### 部署前
- [ ] 代码已推送到GitHub
- [ ] 本地测试通过
- [ ] 构建成功（npm run build）

### 部署后
- [ ] 访问部署链接正常
- [ ] 首次加载AI模型（约23MB，需等待）
- [ ] 上传MusicXML文件测试
- [ ] AI分析功能正常
- [ ] 视觉编辑器正常
- [ ] 预览播放正常
- [ ] 导出功能正常

## 🔗 获取部署链接

### Vercel
部署成功后，Vercel会提供：
- **Production URL**: `https://your-project.vercel.app`
- **Preview URLs**: 每次push自动生成预览链接

### GitHub Pages
格式：`https://[username].github.io/[repository-name]/`

## 🐛 常见问题

### Q: 首次加载很慢
**A**: 正常现象。首次使用时需要下载AI模型（约23MB），之后会缓存到浏览器IndexedDB中，后续访问会快很多（约3秒）。

### Q: 构建失败
**A**: 检查：
- Node.js版本（需要18+）
- package.json中的依赖是否完整
- 查看构建日志找到具体错误

### Q: 页面空白
**A**: 检查：
- 浏览器控制台是否有错误
- 清除浏览器缓存
- 尝试无痕模式
- 确保使用现代浏览器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）

### Q: 文件上传失败
**A**: 检查：
- 文件格式（.mxl, .musicxml, .mp3）
- 文件大小（建议<50MB）
- 浏览器是否支持File API

### Q: AI模型加载失败
**A**: 检查：
- 网络连接是否正常
- 是否被防火墙阻止访问 huggingface.co
- 尝试刷新页面重新加载

## 🎯 测试部署

部署完成后，使用示例文件测试：

1. **访问部署链接**
2. **上传测试文件**：
   - MusicXML: `CompositionExamples/Mozart Piano K.545 First Movement/sonata-no-16-1st-movement-k-545.mxl`
   - MP3: `CompositionExamples/Mozart Piano K.545 First Movement/sonata-no-16-1st-movement-k-545.mp3`
3. **验证功能**：
   - AI模型加载（首次约10-30秒）
   - AI分析（约15-30秒）
   - 视觉编辑
   - 预览播放
   - 导出功能

## 📊 性能说明

| 设备类型 | 模型加载（首次） | 模型加载（缓存后） | 分析时间 |
|---------|----------------|------------------|---------|
| 桌面电脑 | ~10秒 | ~3秒 | ~15秒 |
| 笔记本 | ~15秒 | ~5秒 | ~25秒 |
| 移动设备 | ~30秒 | ~10秒 | ~45秒 |

## 📞 获取帮助

- **Vercel文档**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Pages文档**: [docs.github.com/pages](https://docs.github.com/pages)
- **Transformers.js文档**: [huggingface.co/docs/transformers.js](https://huggingface.co/docs/transformers.js)

---

**预计部署时间**：
- Vercel: 3-5分钟
- GitHub Pages: 3-5分钟

**推荐部署方式**：Vercel（更好的CDN支持，自动HTTPS）
