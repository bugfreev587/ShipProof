# ShipProof — Product Requirements Document

## 1. 产品定位

### 一句话描述
ShipProof帮indie hackers和small startups把每次产品发布变成可积累的社会证明资产。

### 核心问题
Indie hackers花数月build产品，但只花30分钟准备launch。发布后社区的正面反馈散落在Twitter、Reddit、Product Hunt各处，从未被系统性收集和利用。每次launch都是一次性事件，没有留下可复用的资产。

### 解决方案
两个核心功能形成闭环：
1. **Launch Content Generator** — AI生成适配各平台的发布文案，让每次launch有准备
2. **Social Proof Collector & Display** — 收集发布后的社区好评，生成可嵌入的展示墙

闭环：Launch → 收到好评 → 收集展示 → 增强下次launch的credibility → 循环

### 目标用户
- **Primary**: Indie hackers / Solo founders（1人团队，正在build in public）
- **Secondary**: Small startups（2-5人，频繁发布feature更新）
- 这些人会在Product Hunt、Reddit r/SaaS、Hacker News、Twitter/X、IndieHackers上发布产品

### 不是什么
- 不是testimonial收集工具（不发表单给客户——那是testimonial.to的事）
- 不是社交媒体管理工具（不自动发帖到任何平台）
- 不是SEO/博客内容生成器
- 不是review管理平台（不是G2/Capterra）
- 不是付费广告文案工具

### 竞品定位
| 产品 | 做什么 | ShipProof的差异 |
|------|--------|----------------|
| testimonial.to | 收集客户video testimonial | ShipProof收集社区反馈（PH/Reddit/Twitter），面向早期产品 |
| Senja | testimonial收集+展示 | 同上，ShipProof不发表单，手动收集公开社区反馈 |
| Buffer/Hootsuite | 社交媒体排程发帖 | ShipProof专注launch场景，生成内容但不发帖 |
| ChatGPT/Claude | 通用AI写作 | ShipProof专精各平台launch文案，了解PH/HN/Reddit的文化和规则 |

### 设计参考
- testimonial.to — 深色主题、极简Dashboard、Wall of Love展示风格
- Plausible Analytics — 极简、一目了然、无噪音

---

## 2. 核心功能详细规格

### 2.1 Launch Content Generator

#### 用户流程

```
Step 1: 输入产品信息（一次性填写，后续复用）
  - 产品名称 (必填)
  - 产品URL (必填)
  - 一句话描述 (必填，如 "AI-powered prompt optimizer for developers")
  - 详细描述 (可选，2-3句话展开核心价值)
  - 目标用户 (可选，如 "indie hackers who use Claude Code daily")

Step 2: 本次发布信息
  - 发布类型: Initial Launch / Feature Update / Major Update
  - Launch Notes (必填, textarea):
      这次发布的核心内容。可以是:
      - 新功能列表 ("Added dark mode, keyboard shortcuts, export to PDF")
      - commit log / changelog 摘要
      - 解决了什么用户问题 ("Users complained about eye strain → dark mode")
      - 关键数据 ("50% faster load time", "3 new integrations")
      - 任何希望AI围绕生成的要点
      placeholder: "Paste your changelog, key features, or talking points for this launch..."
      这是AI生成内容的核心输入——产品信息提供背景，Launch Notes提供这次的具体发布内容

Step 3: 选择目标平台 (多选)
  ☑ Product Hunt
  ☑ Reddit (选择具体subreddit: r/SaaS, r/startups, r/sideproject, r/webdev, 或自定义)
  ☑ Hacker News (Show HN)
  ☑ Twitter/X (launch thread)
  ☑ IndieHackers

Step 4: AI生成 → 草稿 (Draft)
  点击 [Generate] → AI为每个选中的平台生成一份文案
  AI使用: 产品信息(背景) + Launch Notes(本次重点) + 平台规则 来生成
  这是草稿状态，用户可以：
    - 逐个平台查看和编辑文案
    - 点击 [Regenerate] 对单个平台重新生成
    - 点击 [Regenerate All] 全部重新生成
    - 手动编辑任何文案内容

Step 5: 确认 → 版本化 (Version)
  用户review满意后，点击 [Confirm & Save Version]
    - 系统自动生成版本号: v{N}.x_{MMDDYYYYHHmm}
      例如: v1.x_031120260832 (第1个版本，2026年3月11日08:32生成)
    - 用户输入版本标题 (如 "Product Hunt Launch" 或 "Dark Mode Feature")
    - 草稿正式保存为一个版本
    - 版本不可修改（只读）
    - 版本列表中可查看完整历史

Step 6: 复制并手动发布
  每个平台的文案旁有 [Copy] 按钮
  用户自己去各平台粘贴发布
  可选: 显示发布日checklist (最佳发帖时间建议)
```

#### 版本化规则

```
Draft（草稿）:
  - 每个产品同一时间只有一个活跃草稿
  - AI生成和用户编辑都在草稿上操作
  - 重新生成会覆盖当前草稿
  - 草稿不出现在版本列表中

Version（版本）:
  - 用户点击 [Confirm & Save Version] 后创建
  - 版本号自动生成: v{N}.x_{MMDDYYYYHHmm}，N为自增序号，时间为确认时刻
  - 每个版本有: 版本号(自动)、标题(用户填写)、创建时间、所有平台文案
  - 版本为只读，不可修改
  - 版本列表按时间倒序排列
  - 代表一次真实的产品发布/feature更新事件
```

#### AI生成的平台适配规则

```
Product Hunt:
  - 标题: 简短有力，不超过60字符
  - 副标题: 一句话价值主张
  - 描述: 3-4段，包含问题→解决方案→核心功能→CTA
  - 首评论 (Maker Comment): 个人故事+为什么build这个+请求反馈
  - 语气: 友好、个人化、避免过度营销

Reddit (因subreddit而异):
  - r/SaaS: 可以直接介绍产品，标题具体描述pain point
  - r/startups: 偏向分享journey和lessons learned
  - r/sideproject: 展示what you built + 请求feedback
  - 通用规则: 避免纯自我推广，以分享和讨论为主
  - 不使用外部链接在标题中（大部分sub会过滤）

Hacker News (Show HN):
  - 标题格式: "Show HN: [产品名] – [一句话描述]"
  - 无描述body（HN的Show HN只有标题+URL）
  - 可选: 首评论解释技术决策和动机
  - 语气: 技术导向、谦逊、避免营销语言

Twitter/X (Launch Thread):
  - 5-10条推文的thread
  - 第1条: Hook + 核心价值
  - 中间: 功能亮点 + 截图建议 + build故事
  - 最后1条: CTA + 链接
  - 每条推文控制在280字符内
  - 使用emoji但不过度

IndieHackers:
  - 帖子格式: 分享journey + what I built + numbers(如有)
  - build in public风格，诚实分享过程
  - 请求社区feedback
  - 避免纯广告贴
```

#### 发布日Checklist

```
AI根据选择的平台自动生成checklist:

☐ [周一-周四] 最佳发布日（避免周末）
☐ Product Hunt: 太平洋时间 00:01 发布（新一天开始时）
☐ Twitter thread: 上午9-11点发布（高活跃时段）
☐ Reddit: 根据subreddit活跃时间建议
☐ HN: 工作日上午（美东时间10-12点）
☐ IH: 工作日（社区最活跃时段）
☐ 准备好产品截图/GIF
☐ 确保landing page已更新
☐ 准备好回复评论（launch后2小时是关键）
```

### 2.2 Social Proof — Product / Proof / Widget / Wall 架构

#### 核心概念

```
=== 简化架构 ===

Product（用户的产品/项目）
  用户注册后创建的产品。包含产品信息、Launch Content版本、和所有Proof。
  例如: "ShipProof"、"MyApp"

Proof（最小展示单元）
  一条经过收集、编辑确认的好评。
  属于且仅属于一个Product。
  可以加自定义Tag。
  可以link到一个Launch Content版本（关联到哪次发布产生的好评）。

Widget（嵌入组件）
  从Product中选择1或多个Proof，嵌入到用户网站。
  横向排列，用户可以左右滑动浏览。
  通过iframe embed code嵌入。

Wall（独立展示页面，Pro/Business）
  从Product中挑选多个Proof，在一个独立页面上散落展示。
  类似testimonial.to的Wall of Love。
  有自己的公开URL (shipproof.io/w/{slug})。

=== 关系 ===

  Product ──has many──→ Proof（一对多）
  Proof ──linked to──→ LaunchVersion（多对一，可选）
  Proof ──has many──→ Tag（多对多）
  Widget ──selects from──→ Product的Proof（配置选择哪些Proof展示）
  Wall ──selects from──→ Product的Proof（手动挑选Proof组合）
```

#### Proof 收集流程

```
Step 1: 在Product下添加Proof
  用户在Product页面点击 [+ Add Proof]

Step 2: 输入好评内容（三种方式选一）

  a) 粘贴URL
     支持: Twitter/X帖子URL、Reddit评论URL、PH评论URL
     系统提取: 作者名、作者头像(如果URL支持)、内容预览
     用户确认/编辑提取的内容
    
  b) 粘贴文字
     手动输入评论原文
     填写: 评论原文、作者名、作者title/公司(可选)
    
  c) 上传截图
     拖拽或选择图片
     填写: 作者名、来源平台、描述(可选)

Step 3: 补充信息
  - 来源平台: Product Hunt / Reddit / Twitter/X / Hacker News / IndieHackers / Other
  - 作者名 (必填)
  - 作者title/公司 (可选)
  - 作者头像URL (可选)
  - 日期 (默认今天，可修改)
  - Tags (可选，用户自定义标签，如 "ux", "speed", "pricing", "support")
  - Linked Version (可选，关联到哪个Launch Content版本)

Step 4: 编辑确认
  用户review原文，可选择编辑（修正typo、缩短等）
  没有问题的可以直接确认
  编辑后保存，不保留编辑历史
  点击 [Save] → Proof正式创建

Proof创建后:
  出现在Product的Proof列表中
  可以被Tag筛选找到
  可以被Widget和Wall引用
```

#### Tag系统

```
Tag:
  用户自定义，自由输入
  每个Proof可以有0个或多个Tag
  Tag用于在Product内筛选和分类Proof
  常见Tag示例: "ux", "fast", "pricing", "support", "design", "must-have"

Product内Proof列表:
  支持按Tag筛选 (点击Tag → 只显示含该Tag的Proof)
  支持搜索 (按作者名、内容文字搜索)
  支持排序 (按日期、featured状态)
```

#### Widget（嵌入组件）

```
Widget功能:
  从Product的Proof中选择要展示的条目
  嵌入到用户的landing page / 网站

Widget布局:
  横向排列，用户可以左右滑动
  每张Proof卡片包含:
    - 评论原文 (或截图)
    - 作者名 + title(如有)
    - 作者头像(如有)
    - 来源平台图标
    - 日期

embed code:
  <iframe 
    src="https://shipproof.io/embed/{product-slug}" 
    width="100%" height="200" frameborder="0"
    style="border:none; border-radius:12px;"
    loading="lazy">
  </iframe>

Widget样式选项:
  - 主题: Dark / Light (默认Dark)
  - 最大显示数量: 1 / 3 / 6 / All
  - 是否显示来源平台图标: Yes / No
  - 边框圆角: 0 / 8 / 12 / 16px
  - 卡片间距

Widget底部: "Powered by ShipProof" 小字链接（Free/Pro Plan）
Business Plan: 可移除branding
```

#### Wall（独立展示页面，Pro/Business Plan）

```
Wall创建:
  用户在Product页面点击 [+ Create Wall]
  输入Wall名称 (如 "Homepage Best Reviews")
  从Product的Proof中手动勾选要展示的条目
  调整展示顺序 (拖拽排序)

Wall展示:
  公开URL: shipproof.io/w/{wall-slug}
  独立全页面，深色背景
  Masonry Grid布局（Proof卡片散落排列，类似testimonial.to Wall of Love）
  
  每张Proof卡片包含:
    - 评论原文 (或截图)
    - 作者名 + title(如有)
    - 作者头像(如有)
    - 来源平台图标
    - 日期

  页面顶部: Product名称 + 描述
  页面底部: "Powered by ShipProof" (Free/Pro) / 可移除 (Business)

Wall的价值:
  Widget是嵌入到别人网站的一个小横条
  Wall是一个独立的、可分享的全页面——放在Twitter bio、邮件签名、pitch deck中
  每个Wall都是一个公开页面 = SEO入口 + PLG传播渠道
```

#### PLG增长机制

```
"Powered by ShipProof" logo出现在:
  - 所有Free/Pro用户的Widget中
  - 所有Free/Pro用户的Wall页面中
  Business Plan用户可以移除

访客看到 "Powered by ShipProof"
  → 点击
  → 跳转ShipProof官网
  → 注册
与testimonial.to的增长策略相同

Wall的PLG效果更强:
  Wall是独立公开页面，可被搜索引擎索引
  用户会把Wall链接分享到社交媒体
  每一个Pro用户创建的Wall都是免费广告
```

#### Dashboard管理

```
Dashboard首页 (/dashboard):
  顶部导航: [Logo] [Dashboard] [Settings] [Avatar▾]
  
  Product列表:
    卡片布局，每张卡片: Product名称 + Proof数量 + 最新版本
    [+ New Product] 按钮

单个Product页面 (/dashboard/products/{id}):
  
  Tab 1: Proofs
    - Proof列表 (Tag筛选 + 搜索 + 排序)
    - [+ Add Proof] 按钮
    - 每条Proof旁: [Edit] [Delete] [Toggle Featured]
    - Tag筛选器 (点击Tag过滤)
    - 如果Proof有linked version: 显示版本标签可点击跳转
  
  Tab 2: Launch Content
    - 当前草稿（如有）
    - 版本历史列表
    - [+ New Launch] 按钮
  
  Tab 3: Widget & Wall
    - Widget embed代码 + 实时预览
    - Widget样式配置
    - Wall列表 (Pro/Business)
    - [+ Create Wall] 按钮
    - 每个Wall: 名称 + Proof数量 + 公开链接 + 编辑
```

---

## 3. 设计系统

### 参考: testimonial.to的深色极简风格

```
=== 配色 ===
背景:
  --bg-base: #0F0F10 (极深灰黑)
  --bg-surface: #1A1A1F (卡片/面板背景)
  --bg-elevated: #242429 (弹窗/下拉背景)
  --bg-hover: #2A2A30 (hover状态)

品牌色:
  --brand-primary: #6366F1 (Indigo — 区别于testimonial.to的紫色)
  --brand-primary-hover: #818CF8
  --brand-gradient: linear-gradient(135deg, #6366F1, #8B5CF6) (indigo→purple)

文字:
  --text-primary: #F1F1F3 (主文字，近白)
  --text-secondary: #9CA3AF (次要文字，灰色)
  --text-tertiary: #6B7280 (更淡，placeholder)

边框:
  --border-default: #2A2A30
  --border-hover: #3F3F46

状态:
  --success: #22C55E (绿色)
  --warning: #F59E0B (橙色)
  --error: #EF4444 (红色)

=== 字体 ===
主字体: Inter (与testimonial.to一致)
代码字体: JetBrains Mono
字号: 14px基础, 标题用18/24/32px

=== 组件风格 ===
卡片: bg-surface rounded-xl border border-border-default p-6
按钮(Primary): bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg px-4 py-2
按钮(Secondary): bg-transparent border border-border-default text-text-primary hover:bg-bg-hover rounded-lg
输入框: bg-bg-base border border-border-default rounded-lg focus:border-brand-primary
Badge: bg-brand-primary/10 text-brand-primary rounded-full px-2 py-0.5 text-xs

=== 布局 ===
最大宽度: max-w-6xl (1152px)
Dashboard: 固定顶部导航栏 + 单列内容
无侧边栏（极简）
```

### 关键页面

```
Landing Page (shipproof.io):
  深色背景
  Hero: 
    标题: "Turn every launch into lasting social proof"
    副标题: "AI-powered launch content + community proof wall for indie hackers"
    CTA: [Get Started Free]
    下方: 产品截图/动画预览
  
  How It Works (3步):
    1. Generate — AI creates platform-specific launch content
    2. Collect — Gather positive feedback from communities  
    3. Display — Embed your Wall of Proof anywhere
  
  Wall of Proof Demo: 
    实际运行的embed widget demo
    展示ShipProof自己的社区反馈（dogfooding）
  
  Pricing
  FAQ
  Footer

Dashboard (/dashboard):
  顶部导航: [Logo] [Products] [Settings] [Avatar▾]
  Products列表: 卡片网格，每张卡片显示产品名+proof数量+最新版本
  [+ New Product] 按钮

Auth:
  Clerk预构建组件
  深色主题匹配设计系统
  Google OAuth + Email/Password
```

---

## 4. 技术架构

### 技术栈

| 层级 | 选择 | 原因 |
|------|------|------|
| 前端 | Next.js 14+ (App Router) + Tailwind + shadcn/ui | SSR、SEO、已有经验 |
| 后端 | Go + Chi router | 创始人第一语言、高性能 |
| 数据库 | PostgreSQL (Railway) + sqlc + golang-migrate | 已验证方案 |
| 认证 | Clerk | 已验证方案（TokenGate + B4After经验）|
| AI | Anthropic Claude API (Sonnet) | 文案生成质量高、成本合理 |
| 图片存储 | Cloudflare R2 | 存储proof截图，便宜 |
| 邮件 | Resend | 后续可用于通知 |
| 支付 | Stripe | 已验证方案 |
| 部署 | Frontend: Vercel / Backend: Railway (Docker) | 已验证方案 |

### 数据模型

```
User
  - id: UUID (PK)
  - clerk_id: String (unique, NOT NULL)
  - email: String (unique, NOT NULL)
  - name: String
  - avatar_url: String (nullable)
  - plan: Enum ('free', 'pro', 'business')
  - stripe_customer_id: String (nullable)
  - stripe_subscription_id: String (nullable)
  - created_at: Timestamp
  - updated_at: Timestamp

Product (用户的产品/项目)
  - id: UUID (PK)
  - user_id: UUID (FK → User)
  - name: String (NOT NULL, 如 "ShipProof")
  - slug: String (unique, NOT NULL, 用于公开URL)
  - url: String (nullable, 产品URL)
  - description: String (nullable, 一句话描述)
  - description_long: Text (nullable, 详细描述)
  - target_audience: String (nullable)
  - created_at: Timestamp
  - updated_at: Timestamp

LaunchDraft (当前活跃草稿，每个Product最多一个)
  - id: UUID (PK)
  - product_id: UUID (FK → Product, unique — 一个Product只有一个draft)
  - launch_type: Enum ('initial', 'feature_update', 'major_update')
  - launch_notes: Text (NOT NULL, 本次发布的核心内容/changelog/talking points)
  - platforms: JSON (选中的平台列表)
  - content: JSON (各平台生成的文案内容)
    {
      "product_hunt": { "title": "...", "subtitle": "...", "description": "...", "maker_comment": "..." },
      "reddit": [{ "subreddit": "r/SaaS", "title": "...", "body": "..." }],
      "hackernews": { "title": "Show HN: ...", "first_comment": "..." },
      "twitter": { "thread": ["tweet1", "tweet2", ...] },
      "indiehackers": { "title": "...", "body": "..." }
    }
  - created_at: Timestamp
  - updated_at: Timestamp

LaunchVersion (确认后的版本，不可修改)
  - id: UUID (PK)
  - product_id: UUID (FK → Product)
  - version_number: Integer (自增, 1, 2, 3...)
  - version_label: String (自动生成, 如 "v1.x_031120260832"，格式: v{N}.x_{MMDDYYYYHHmm})
  - title: String (NOT NULL, 用户填写, 如 "Product Hunt Launch")
  - launch_type: Enum ('initial', 'feature_update', 'major_update')
  - launch_notes: Text (NOT NULL, 从draft复制过来，记录本次发布的核心内容)
  - platforms: JSON
  - content: JSON (与draft结构相同)
  - created_at: Timestamp

Proof (最小展示单元，一条好评)
  - id: UUID (PK)
  - product_id: UUID (FK → Product)
  - status: Enum ('approved', 'pending', 'rejected') (default 'approved')
      V1手动添加的Proof直接approved；V2表单收集的进入pending待审核
  - collection_method: Enum ('manual', 'form') (default 'manual')
      V1全部是manual；V2支持form（用户通过公开收集表单提交）
  - source_platform: Enum ('product_hunt', 'reddit', 'twitter', 'hackernews', 'indiehackers', 'direct', 'other')
      'direct' = 用户通过收集表单直接提交，不来自任何第三方平台（V2扩展用）
  - source_url: String (nullable, 原始链接)
  - content_type: Enum ('text', 'image')
  - content_text: Text (nullable, 评论原文，用户可编辑)
  - content_image_url: String (nullable, 截图URL，存储在R2)
  - author_name: String (NOT NULL)
  - author_title: String (nullable, 如 "Founder of XYZ")
  - author_avatar_url: String (nullable)
  - proof_date: Date (评论日期)
  - linked_version_id: UUID (nullable, FK → LaunchVersion, 关联到哪次发布)
  - is_featured: Boolean (default false)
  - display_order: Integer (排序用)
  - created_at: Timestamp
  - updated_at: Timestamp

ProofTag (Proof和Tag的多对多关联)
  - id: UUID (PK)
  - proof_id: UUID (FK → Proof)
  - tag: String (NOT NULL, 用户自定义标签, 如 "ux", "speed")
  UNIQUE(proof_id, tag)

Wall (独立展示页面，Pro/Business Plan)
  - id: UUID (PK)
  - product_id: UUID (FK → Product)
  - name: String (NOT NULL, 如 "Homepage Best Reviews")
  - slug: String (unique, NOT NULL, 用于公开URL)
  - created_at: Timestamp
  - updated_at: Timestamp

WallProof (Wall和Proof的多对多关联，含排序)
  - id: UUID (PK)
  - wall_id: UUID (FK → Wall)
  - proof_id: UUID (FK → Proof)
  - display_order: Integer (在Wall中的排序)
  UNIQUE(wall_id, proof_id)

WidgetConfig (Product的嵌入Widget配置)
  - id: UUID (PK)
  - product_id: UUID (FK → Product, unique)
  - theme: Enum ('dark', 'light') (default 'dark')
  - max_items: Integer (default 6)
  - show_platform_icon: Boolean (default true)
  - border_radius: Integer (default 12)
  - card_spacing: Integer (default 16)
  - show_branding: Boolean (default true — Free/Pro plan强制true)
  - created_at: Timestamp
  - updated_at: Timestamp
```

### API端点

```
=== Health ===
GET    /api/health                          — 健康检查 (返回 {"status":"ok","version":"...","uptime":"..."})
                                              Railway部署后用于验证服务是否正常运行

=== 日志规范 ===
所有API请求统一使用结构化日志 (JSON格式，推荐slog):
  - 每个请求记录: method, path, status_code, duration_ms, request_id, user_id(如有)
  - 错误请求额外记录: error_message, stack_trace
  - Claude API调用记录: prompt_tokens, completion_tokens, duration_ms
  - Stripe webhook记录: event_type, customer_id, subscription_id
  - 敏感信息不入日志: API keys, tokens, 用户密码
  中间件层统一处理，不需要每个handler手动写日志

=== 认证 ===
POST   /api/webhooks/clerk                — Clerk webhook (用户同步)

=== Products ===
GET    /api/products                        — 列出用户的所有Product
POST   /api/products                        — 创建新Product
GET    /api/products/{id}                   — 获取Product详情
PUT    /api/products/{id}                   — 更新Product信息
DELETE /api/products/{id}                   — 删除Product

=== Launch Content ===
GET    /api/products/{id}/draft             — 获取当前草稿
POST   /api/products/{id}/generate          — AI生成文案 (创建/覆盖草稿)
PUT    /api/products/{id}/draft             — 保存草稿编辑
POST   /api/products/{id}/confirm           — 确认草稿为版本
GET    /api/products/{id}/versions          — 列出版本历史
GET    /api/products/{id}/versions/{vid}    — 获取特定版本

=== Proofs ===
GET    /api/products/{id}/proofs            — 列出Product内所有Proof (支持tag筛选)
POST   /api/products/{id}/proofs            — 添加新Proof
PUT    /api/proofs/{pid}                   — 编辑Proof
DELETE /api/proofs/{pid}                   — 删除Proof
PUT    /api/proofs/{pid}/featured          — 切换featured状态
PUT    /api/proofs/{pid}/order             — 更新排序
POST   /api/proofs/{pid}/tags             — 添加Tag
DELETE /api/proofs/{pid}/tags/{tag}        — 移除Tag

=== Widget ===
GET    /api/products/{id}/widget            — 获取Widget配置
PUT    /api/products/{id}/widget            — 更新Widget配置

=== Walls (Pro/Business Plan) ===
GET    /api/products/{id}/walls             — 列出Product的所有Wall
POST   /api/products/{id}/walls             — 创建新Wall
GET    /api/walls/{id}                     — 获取Wall详情 (含关联的Proofs)
PUT    /api/walls/{id}                     — 更新Wall信息
DELETE /api/walls/{id}                     — 删除Wall
POST   /api/walls/{id}/proofs              — 添加Proof到Wall
DELETE /api/walls/{id}/proofs/{pid}        — 从Wall移除Proof
PUT    /api/walls/{id}/proofs/order        — 更新Wall中Proof排序

=== 公开端点 (无需认证) ===
GET    /api/public/products/{slug}/proofs   — 获取Product的公开Proof数据 (Widget用)
GET    /api/public/walls/{slug}/proofs      — 获取Wall的公开Proof数据

=== Stripe ===
POST   /api/stripe/create-checkout         — 创建Checkout Session
POST   /api/stripe/create-portal           — 创建Customer Portal
POST   /api/webhooks/stripe                — Stripe webhook
```

### 前端路由

```
/ — Landing Page
/sign-in — 登录 (Clerk)
/sign-up — 注册 (Clerk)

/dashboard — Product列表
/dashboard/products/{id} — Product详情 (Proofs + Launch Content + Widget & Wall)
/dashboard/settings — 用户设置 (Plan, Billing)

/w/{slug} — Wall公开展示页面 (Pro/Business)
/embed/{slug} — Product Widget嵌入 (iframe内容，横向滑动)
/embed/w/{slug} — Wall嵌入Widget (iframe内容)
/pricing — 定价页面
```

---

## 5. 定价

```
=== Free Plan ===
  - 1个 Product
  - 1条 Proof
  - Widget: ✅ 带 "Powered by ShipProof" branding
  - Wall: ❌
  - Launch Content: 每月3次生成
  - 版本历史: 最多3个版本

  升级动力: 用户添加第2条Proof时触发升级提示

=== Pro Plan — $12/月 ($9/月 年付) ===
  - 1个 Product
  - 无限 Proof
  - Widget: ✅ 带 "Powered by ShipProof" branding
  - Wall: ✅ 带 "Powered by ShipProof" branding
  - Launch Content: 无限生成
  - 版本历史: 无限
  - Tag筛选: ✅
  - Proof linked to version: ✅

  升级动力: 用户需要多个Product或想移除branding时触发升级提示

=== Business Plan — $29/月 ($24/月 年付) ===
  - 多个 Product (最多10个)
  - 无限 Proof
  - Widget: ✅ 可移除 "Powered by ShipProof" branding
  - Wall: ✅ 可移除 "Powered by ShipProof" branding
  - Launch Content: 无限生成
  - 版本历史: 无限
  - Tag筛选: ✅
  - Proof linked to version: ✅

定价策略:
  Free Plan极度限制（1条Proof），让用户体验流程但必须升级才能真正使用
  Pro $12/月处于indie hacker舒适区（和Plausible $9、testimonial.to $20类似价位）
  Business $29/月针对有多个产品/需要移除branding的用户
  
  核心升级阶梯:
    Free→Pro: 添加第2条Proof时（"你的好评太多了，升级到Pro解锁无限Proof"）
    Pro→Business: 需要多个Product或想移除branding时
  
  PLG增长:
    Free/Pro的Widget和Wall都带branding → 每个嵌入和Wall页面都是免费广告
    Wall是独立公开页面，PLG传播效果比嵌入Widget更强
    只有Business可以移除 → 对品牌形象有要求的用户会升级
```

---

## 6. MVP Scope & 实施计划

### MVP必须做 (V1)

```
Phase 1 (Week 1): 基础架构
  - 项目初始化 (Next.js + Go + Railway + Vercel)
  - Clerk认证集成
  - 数据库schema + 迁移 (User, Product, Proof, ProofTag, LaunchDraft, LaunchVersion, WidgetConfig, Wall, WallProof)
  - 基础Dashboard布局 (深色主题)
  - Product CRUD

Phase 2 (Week 2): Launch Content Generator
  - 产品信息输入表单（在Product内）
  - 平台选择UI
  - Claude API集成 (文案生成)
  - 草稿编辑界面 (各平台tab切换)
  - Copy按钮
  - 版本确认流程 (Draft → Version)
  - 版本历史列表（只读查看）

Phase 3 (Week 3): Proof收集 + Widget + Wall
  - Add Proof表单 (文字/URL/截图三种输入)
  - Proof列表管理 (编辑/删除/featured/排序)
  - Tag系统 (添加/移除/筛选)
  - Proof linked to version（关联到Launch版本）
  - R2图片上传 (截图)
  - Widget嵌入 (/embed/{slug}) — 横向可滑动卡片
  - Widget样式配置 (Dark/Light, 最大显示数量, 圆角, 间距)
  - Wall创建 + 公开页面 (/w/{slug}) — Masonry Grid布局
  - Wall Proof管理 (挑选/排序)

Phase 4 (Week 4): 定价 + Landing Page + 上线
  - Stripe集成 (Free/Pro/Business)
  - Plan限制检查 (Proof数量/Product数量/Wall branding)
  - Landing Page (深色主题)
  - SEO基础
  - 部署到production
  - 自己用ShipProof发布ShipProof (dogfooding)
```

### V2 (后续迭代)

```
- 主动收集表单 (Collection Form) — testimonial模式扩展
    CollectionForm实体: 每个Product可创建公开收集链接 (shipproof.io/collect/{slug})
    产品owner发链接给用户，用户自行提交评价（文字+星级评分+姓名+头像）
    提交后Proof进入pending状态，owner在审核队列中approve/reject
    已预留字段: Proof.status (pending/approved/rejected) + Proof.collection_method (form) + source_platform (direct)
- AI自动标签分类 (标注Proof关于UX/价格/速度等)
- AI生成社交分享图片 (把Proof变成可发Twitter的图片)
- 发布日提醒 (邮件通知)
- Analytics (Widget浏览量/点击量追踪)
- 更多平台支持 (LinkedIn, Discord, Facebook Groups)
- 批量导入 (CSV)
- Team功能 (多人协作)
```

---

## 7. 品牌与视觉设计

### Logo

```
=== Logo构成 ===

Logo Mark (图标):
  三角形循环结构，三个节点代表 Ship / Collect / Display
  节点之间用带箭头的弧线连接，形成闭环飞轮
  每个节点内有对应小图标:
    - Ship: 火箭 (向上的三角+底座)
    - Collect: 向下收集箭头
    - Display: 浏览器窗口 (矩形+内容线条)
  节点使用圆形背景 (Indigo 12%透明度) + Indigo描边图标

Wordmark (文字):
  "ShipProof"
  字体: Plus Jakarta Sans ExtraBold (与B4After同系列)
  "Ship" 使用 --color-text-primary (黑/白随主题)
  "Proof" 使用品牌色 Indigo #6366F1

Tagline:
  "Ship it. Prove it. Show it."
  字体: 常规体, 13px, secondary色

=== 品牌色 ===

主色: Indigo #6366F1 (区别于testimonial.to的紫色)
辅色:
  - Ship节点: Indigo #6366F1
  - Collect节点: Emerald #10B981
  - Display节点: Amber #F59E0B
背景: 深色主题为主 (与testimonial.to风格一致)

=== Logo使用场景 ===

  Favicon: 仅三角循环图标 (无文字)
  Nav Bar: 图标 + "ShipProof" 文字 (横向排列)
  Landing Page: 完整 Logo Mark + Wordmark + Tagline
  Widget "Powered by" badge: 小图标 + "ShipProof" 文字
  Wall页面底部: 小图标 + "Powered by ShipProof"
```

### Landing Page Hero — 飞轮循环图示

```
=== 位置 ===

Landing Page首屏 (Hero区域)，标题下方居中展示
目的: 让visitor一眼看懂产品做什么——Ship, Collect, Display的闭环循环

=== 视觉设计 ===

布局: 倒三角形排列
  - Ship (顶部居中) — Indigo #6366F1
  - Collect (右下) — Emerald #10B981
  - Display (左下) — Amber #F59E0B

每个节点:
  - 外圈: 脉冲光晕动画 (依次亮起，间隔1秒，暗示飞轮在转动)
  - 中圈: 56px圆形，背景色填充 + 对应颜色描边
  - 内部: 对应图标 (火箭/收集箭头/浏览器窗口)
  - 下方文字: 节点名称 (16px, 500, 对应颜色) + 一句话说明 (12px, secondary)

三条连接箭头:
  - Ship → Collect: Indigo色弧线
  - Collect → Display: Emerald色弧线
  - Display → Ship: Amber色弧线
  - 全部使用流动虚线动画 (stroke-dasharray + dash offset动画)
  - 箭头末端带三角形marker

中心文案:
  "Each cycle makes your next launch stronger"
  字体: 11px, tertiary色, 两行居中

节点说明文案:
  Ship: "AI generates launch copy for PH, Reddit, HN, Twitter, IH"
  Collect: "Paste URLs, text, or screenshots of community praise"
  Display: "Embed widget or share Wall on your landing page"

=== 动画 ===

  脉冲光晕: 3秒周期, ease-in-out, 三个节点依次延迟1秒
  流动箭头: 1.2秒周期, linear, 三条箭头依次延迟0.4秒
  全部动画使用CSS @keyframes, 不依赖JS库
  尊重 prefers-reduced-motion 设置
```

---

## 8. 成功指标

### 上线第一个月
- 50+ 注册用户
- 200+ launch内容生成次数
- 100+ Proof条目被收集
- 10+ Widget/Wall被嵌入或分享到外部
- 5+ 付费用户

### 北极星指标
- **月活launch生成数**: 衡量Launch Content功能使用频率
- **Proof条目总数**: 衡量收集功能的使用深度
- **Widget嵌入数 + Wall页面浏览数**: 衡量PLG增长潜力 (每个Widget/Wall都是免费广告)
- **MRR**: 商业健康度

---

## 9. 域名和部署

```
域名: shipproof.io (首选) 或 shipproof.app
前端: shipproof.io → Vercel
后端: api.shipproof.io → Railway (Docker)
Widget嵌入: shipproof.io/embed/{product-slug}
Wall公开页面: shipproof.io/w/{wall-slug}
Wall嵌入Widget: shipproof.io/embed/w/{wall-slug}
```

---

## 10. MVP注意事项

```
MVP包含完整功能:
  V1做Product + Proof + Launch Content + Widget + Wall
  Wall在Pro Plan带branding开放，是核心PLG渠道
  三个Plan全部上线 (Free/Pro/Business)

MVP的核心验证假设:
  1. Indie hackers愿意为launch content生成付费吗？
  2. 收集社区好评并嵌入到landing page这个工作流有没有人用？
  3. PLG（Powered by ShipProof badge）能不能带来自然增长？
  4. Wall公开页面能不能带来SEO和社交传播？

Dogfooding:
  ShipProof自己是第一个用户
  用ShipProof生成ShipProof的launch content
  收集ShipProof自己的社区好评
  在shipproof.io的landing page上嵌入ShipProof自己的Widget
  创建ShipProof的Wall of Proof页面
```
