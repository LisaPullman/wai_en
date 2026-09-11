# Vercel 部署指南（外恩英语乐园）

> 仓库：`https://github.com/LisaPullman/wai_en`（main 分支 = 生产）
> 技术栈：Next.js 16（全静态 SSG）——Vercel 零配置即可部署。

---

## 一、首次部署（5 分钟）

### 1. 确认代码已推送

```bash
git add -A
git commit -m "部署"
git push origin main
```

### 2. 在 Vercel 导入仓库

1. 打开 [vercel.com](https://vercel.com) → 用 **GitHub 账号**登录（免费 Hobby 计划即可）
2. 点 **Add New → Project**
3. 在 GitHub 一栏找到 `LisaPullman/wai_en` → **Import**
   - 首次会请求 GitHub 授权，只授权这一个仓库即可
4. 配置页**全部保持默认**：
   - Framework Preset：`Next.js`（自动识别）
   - Build Command：`next build`（默认）
   - Output Directory：默认
   - **Environment Variables：无需任何变量**（运行时零外部依赖）
5. 点 **Deploy** → 约 1-2 分钟完成
6. 得到 `wai-en-xxxx.vercel.app` 域名，点开即用 ✅

> 部署后每次 `git push origin main` 都会自动重新部署（push 即发布）。

---

## 二、绑定自定义域名（国内访问必需 ⚠️）

**`*.vercel.app` 域名在中国大陆基本无法访问**，孩子在国内使用必须绑自定义域名：

1. 准备一个域名（阿里云/腾讯云/Cloudflare 注册均可）
2. Vercel 项目页 → **Settings → Domains → Add** → 输入你的域名（如 `en.example.com`）
3. 按提示到域名 DNS 服务商加记录：

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| CNAME | `en`（子域名） | `cname.vercel-dns.com` |

4. 回到 Vercel 等待证书签发（几分钟），显示 ✅ 即可
5. 用 `https://en.example.com` 访问

> - 若用**根域名**（`example.com`）：A 记录 → `76.76.21.21`（Vercel 页面会给出当前值，以其为准）
> - 域名 DNS 在国内解析商时生效快；若被墙可把 DNS 托管到 Cloudflare
> - 麦克风/录音功能需要 HTTPS——Vercel 证书自动配置，无需操作

---

## 三、素材资产（可选，不影响部署）

网站**不依赖任何运行时 AI/谷歌服务**，全部素材是仓库里的静态文件：

| 命令 | 作用 |
|---|---|
| `npm run assets:audio` | 补齐缺失 TTS 音频（幂等，`--force` 全量重做） |
| `npm run assets:images` | 补齐缺失插图（免费 flux 配额每天 1 万 neurons，用完次日自动重置） |

- 新增/修改内容 JSON（`src/content/**`）后重跑对应命令，再 push
- 当前已知缺口：`public/images/words/yellow.jpg`（当日配额用尽，运行时自动用 🟡 兜底；次日执行 `npm run assets:images` 自动补上）

---

## 四、本地验证（push 前自检）

```bash
npm test          # 21 个单元测试
npm run build     # 生产构建 + 全页面 SSG 预渲染
npm run dev       # 本地开发 http://localhost:3000
```

## 五、常见问题

| 现象 | 处理 |
|---|---|
| 部署构建失败 | 看 Vercel 构建日志；多为 TS 类型错误，本地 `npm run build` 先跑一遍 |
| 国内打开慢/打不开 | 确认用的是自定义域名而非 `*.vercel.app`；检查 CNAME 是否生效 |
| 没有声音 | 首次点按页面任意按钮解锁音频（iOS 限制）；家长页可清「失败音频缓存」重试 |
| 学习进度丢了 | 进度存在设备浏览器 localStorage，换设备/清缓存会重置（v2 将加云端同步） |
| 麦克风不能用 | 检查系统浏览器权限；不支持时自动降级为「听+跟读」模式，功能不缺失 |

## 六、部署后检查清单

- [ ] 打开域名能看到课程地图（Foxy 打招呼）
- [ ] 首页「今日计划」四项任务可跳转
- [ ] 上课：卡片点读有声音（Ana 儿童音色）、翻卡有例句
- [ ] 泡泡爆爆能玩、结算得星
- [ ] 故事阅读器：逐词高亮、翻页、读完 +2 星
- [ ] 300 句听力模式：连播/单句循环/慢速
- [ ] 家长页：算术门 → 学习报告正常
