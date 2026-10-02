# EE Compass Canada 项目全貌与逐文件说明

> 答辩准备版，核对日期：2026-09-22。本文依据当前本地代码、自动测试和构建结果编写。它描述的是**已经实现的代码**与**实际完成的验证**，两者不能混为一谈。

## 1. 一句话说明项目

EE Compass Canada 是一个加拿大 Express Entry 信息网站，把 IRCC 官方抽选历史、CRS 自评和社区讨论放在一个界面中。访客可以查抽选、按同类轮次看趋势、计算 CRS 分数；接入 Supabase 后，用户还可以注册、发帖、回复，管理员可以审核内容。它是独立信息平台，不是政府申请入口，也不判断申请人是否具备入池资格。

当前状态可以概括为：**本地预览可用；主要业务代码已写；真实账户、数据库和云端定时同步尚未接入验证；网站尚未公开部署。**

项目本地路径：`/Users/enzuomou/Documents/nau mcit 2/ee-compass-canada`。当前本地分支为 `codex/initial-implementation`。GitHub PR 为 [#1](https://github.com/En4zo/ee-compass-canada/pull/1)；2026-09-22 核对时状态为 **Open**，尚未合并到 `main`。完整代码和本文已推送到该 PR 分支。

## 2. 两种运行状态与功能完成情况

项目使用 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 判断运行状态。两者均未填写时，进入本地预览模式；填写后读取真实数据库。如果只填了其中一项，或数据库发生故障，页面会报错，不会悄悄显示演示数据。

| 功能       | 目前本地预览                                                         | 接入 Supabase 后的代码                                     | 仍需完成的验收                          |
| ---------- | -------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------- |
| 首页       | 最新抽选、CEC 趋势、更新时间、CRS 入口、示例讨论可用                 | 从数据库读取抽选与真实帖子                                 | 云端真实数据与失败状态                  |
| 历史抽选   | 445 条 IRCC 官方记录快照；类别、时间筛选；趋势图、分页表格、官方来源 | 数据库查询和同步状态显示已写                               | 首次导入、生产数据更新                  |
| CRS 计算器 | 四步输入、总分与分项、规则来源、历史参考线可用                       | 同样在浏览器计算，不依赖账号                               | 更多官方案例比对；政策变化时维护规则    |
| 中英双语   | 可切换，语言偏好保存在浏览器                                         | 同样可用                                                   | 真实设备与辅助技术体验检查              |
| 社区       | 仅展示明确标注的虚构示例；不能真实写入                               | 发帖、回复、编辑、删除、主题筛选与内容类型标记代码已写     | 真实账号和云数据库端到端测试            |
| 账户       | 显示需要配置数据库的提示                                             | 注册、登录、退出、密码重置、昵称、个人帖子代码已写         | 邮件确认、回调、重置邮件与会话测试      |
| 管理员     | 显示接入提示                                                         | 审核帖子/评论、同步日志界面和接口已写                      | 建立管理员账号后实测权限                |
| 每日同步   | 静态快照不会自动更新                                                 | IRCC 适配器、受保护接口、数据库事务和 Vercel Cron 配置已写 | 真实密钥、首次导入、Vercel 计划任务测试 |
| 公开网站   | 仅本机可访问                                                         | 部署说明和配置文件已写                                     | 创建 Vercel 项目、部署与域名配置        |

### 已明确排除在第一版之外

没有邀请预测、获邀概率、资格判定、付费咨询、文件上传、材料审核、复杂个性化推荐、政府申请代办或自动提交。历史最低分只提供回顾性参考，**不能据此保证未来邀请**。

## 3. 技术架构：从数据到页面

**技术栈：** Next.js 16 App Router、React 19、TypeScript、Supabase Auth/PostgreSQL、Zod、Recharts、Tailwind/PostCSS、Vitest、PGlite、Playwright。Next.js 同时提供页面与 HTTP 接口，没有另建 Express 后端。

```text
IRCC 官方 JSON
    ↓ 适配器校验字段、编号、日期和数值
受 CRON_SECRET 保护的同步接口
    ↓ Supabase service-role 客户端调用 import_draws RPC
PostgreSQL draws + sync_runs + data_status
    ↓ 服务端 repository 读取
首页 / 历史抽选 / GET /api/draws

浏览器 CRS 表单 → Zod 校验 → 纯 TypeScript 评分函数
                                     ↓
                           总分写入本标签页 sessionStorage
                                     ↓
                         历史图表显示参考线

Supabase Auth → 登录身份 → Next.js 写入接口 → PostgreSQL RLS
                                                   ↓
                                          帖子、评论、审核
```

### 为什么分层

- `src/app` 只决定 URL 对应哪个页面或接口，并组合组件。
- `src/features` 保存业务逻辑，抽选解析和 CRS 计算不依赖页面，便于独立测试。
- `src/lib` 保存环境读取、Supabase 客户端、通用请求处理。
- `supabase/migrations` 管数据结构和数据库权限；前端隐藏按钮不是权限控制。
- `tests` 分别验证评分、抽选同步、接口边界和真实 PostgreSQL 的 RLS 行为。

### CRS 的计算边界

表单可直接使用每项听说读写的 **CLB/NCLC 等级**，也可输入 IELTS General、CELPIP-General、PTE Core、TEF Canada 或 TCF Canada 原始成绩并自动换算。申请人核心因素、随行配偶因素、技能转移能力和附加分分别计算；技能转移最多 100、附加分最多 600、总分最多 1200。配偶不随行或配偶为加拿大公民/永久居民时，使用“无随行配偶”的核心分表。`job offer` 的旧 CRS 附加分已取消，代码没有计入。规则版本写在结果中，数据库也保留版本记录；真正执行评分的是发布的 TypeScript 代码，数据库记录不会自动改变公式。

默认表单是一组**标注为示例**的输入：29 岁、单身、本科、第一语言四项 CLB 9、加拿大工作 1 年，得到 432 分。申请人必须替换为自己的情况。个人背景不会上传或存入数据库；只有点击“加入历史趋势比较”时，总分暂存于当前标签页的 `sessionStorage`。语言偏好保存在 `localStorage`。

### 抽选数据的边界

仓库中的 `src/data/draws.json` 是 2026-09-18 获取的 **445 条官方历史记录快照**，不是实时更新的数据库。页面显示快照时间。类别筛选按原始轮次类型精确比较，默认 CEC，不把不同类别连成一条趋势线。`91a` 等带字母编号按文本保留。早期记录没有 tie-breaking rule 时显示官方未提供，不补造日期。

数据库模式里同步接口会先完整校验一批 IRCC 数据，再通过 PostgreSQL 事务导入。同一轮次编号更新而不重复插入；失败时保留旧记录，记录失败状态，最近成功时间不被覆盖。**这套云端流程尚未在真实 Supabase/Vercel 上跑通。**

### 数据库与权限

迁移文件建立八张表：`draws`（抽选）、`profiles`（昵称）、`posts`（帖子）、`comments`（回复）、`admin_roles`（管理员身份）、`crs_rule_versions`（规则记录）、`sync_runs`（同步日志）、`data_status`（最近检查/成功时间）。邮箱由 Supabase Auth 保存，不复制到公开 `profiles` 表。

所有业务表启用 RLS。访客可以读公开内容；作者只能管理自己的内容；被隐藏内容不能作为普通公开内容显示。`admin_roles` 没有开放普通用户写权限，管理员身份需要维护者在 SQL Editor 中设置。数据库还限制敏感列的更新，并对短时间大量发帖/回复设限。服务密钥只在服务端同步代码使用。

## 4. 每个源码与配置文件的用途

下面覆盖当前仓库中的每个已跟踪文件，并包含本文。路径均相对于项目根目录。`[id]` 是 Next.js 的动态 URL 参数，例如 `/forum/帖子UUID`。

### 4.1 根目录配置与说明

| 文件                                    | 作用                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.env.example`                          | 四个环境变量模板：Supabase URL、公钥、服务端密钥和 Cron 密钥；不含真实密钥。                   |
| `.gitignore`                            | 阻止提交 `node_modules`、`.next`、`.env.local`、测试输出等本机文件。                           |
| `.prettierignore`                       | 格式化时跳过依赖、构建输出、锁文件和大型抽选 JSON。                                            |
| `AGENTS.md`                             | 本地开发代理的 Next.js 使用提示；是开发说明，不是网站功能或课程需求。                          |
| `CLAUDE.md`                             | 指向同一开发提示，方便其他编码工具读取；不是网站功能。                                         |
| `README.md`                             | 项目入口：运行命令、模式说明、阅读顺序、主要限制与文档链接。                                   |
| `docs/ARCHITECTURE.md`                  | 数据流、表结构、接口和权限的技术说明。                                                         |
| `docs/SETUP.md`                         | Supabase 建库、环境变量、邮件回调、首次同步、管理员设置和 Vercel 部署步骤。                    |
| `docs/TESTING.md`                       | 已做的测试、人工检查和云端接入后仍需做的验收。                                                 |
| `docs/PROJECT_STATUS_AND_FILE_GUIDE.md` | 本文：答辩用项目状态、业务边界与逐文件索引。                                                   |
| `package.json`                          | 依赖和 `dev/build/test/lint/typecheck/snapshot` 等命令；生产构建使用 Next.js 的 Webpack 选项。 |
| `package-lock.json`                     | 锁定依赖版本，使 `npm ci` 可重复安装；通常不手工编辑。                                         |
| `next.config.ts`                        | Next.js 配置，设置若干基础安全响应头并隐藏框架标识头。                                         |
| `next-env.d.ts`                         | Next.js 生成的 TypeScript 类型声明入口；通常不手工编辑。                                       |
| `tsconfig.json`                         | TypeScript 严格检查、JSX、`@/` 指向 `src/` 等配置。                                            |
| `eslint.config.mjs`                     | ESLint 的 Next.js、TypeScript 规则及生成目录忽略配置。                                         |
| `postcss.config.mjs`                    | 将 Tailwind CSS 插件接入 PostCSS 构建流程。                                                    |
| `playwright.config.ts`                  | 浏览器测试的桌面/手机视口、预览服务器和基本 URL 配置。                                         |
| `vitest.config.ts`                      | 单元/数据库测试的文件匹配与 `@/` 别名配置。                                                    |
| `vercel.json`                           | 每天 03:00 UTC 调用同步接口的 Cron 计划；部署后才会生效。                                      |

### 4.2 页面、布局和路由：`src/app`

| 文件                               | 作用                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `src/app/layout.tsx`               | 所有页面共用的根布局，装入全局样式、语言/登录状态 Provider、导航 Shell 和页面元信息。 |
| `src/app/globals.css`              | 全站视觉样式、响应式布局、卡片、图表、表格和表单样式。                                |
| `src/app/icon.svg`                 | 浏览器标签页的站点图标。                                                              |
| `src/app/page.tsx`                 | `/` 首页入口；并行读取抽选和帖子，再交给 Dashboard。                                  |
| `src/app/draws/page.tsx`           | `/draws` 历史页入口；读取抽选并组合状态条、筛选图表。                                 |
| `src/app/calculator/page.tsx`      | `/calculator` 页面入口；展示 CRS 表单。                                               |
| `src/app/forum/page.tsx`           | `/forum` 社区列表入口；读取帖子。                                                     |
| `src/app/forum/[id]/page.tsx`      | `/forum/:id` 帖子详情；检查 ID、读取帖子和回复，未找到时显示 404。                    |
| `src/app/forum/[id]/edit/page.tsx` | `/forum/:id/edit` 编辑页；读取现有帖子后显示编辑器，真实写入仍由接口和 RLS 限权。     |
| `src/app/forum/new/page.tsx`       | `/forum/new` 新帖页面入口。                                                           |
| `src/app/account/page.tsx`         | `/account` 账户页；在数据库模式读取当前用户昵称、个人帖子和管理员身份。               |
| `src/app/account/reset/page.tsx`   | `/account/reset` 重置密码后的新密码输入页。                                           |
| `src/app/admin/page.tsx`           | `/admin` 管理页；检查登录/管理员身份，读取最近帖子、回复和同步日志。                  |
| `src/app/loading.tsx`              | 路由加载时的统一等待画面。                                                            |
| `src/app/error.tsx`                | 页面异常时的错误画面和重试按钮。                                                      |
| `src/app/not-found.tsx`            | 找不到页面或帖子的 404 画面。                                                         |
| `src/app/auth/callback/route.ts`   | Supabase 邮件确认/密码重置回调，交换 PKCE code 为会话并跳转。                         |

### 4.3 HTTP 接口：`src/app/api`

| 文件                                       | 作用                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `src/app/api/draws/route.ts`               | 公开 `GET /api/draws`；返回抽选和数据状态，数据库故障返回 503。            |
| `src/app/api/posts/route.ts`               | `POST /api/posts`；校验登录和帖子字段，以当前登录用户 ID 创建帖子。        |
| `src/app/api/posts/[id]/route.ts`          | `PATCH/DELETE /api/posts/:id`；作者编辑或删除帖子。                        |
| `src/app/api/posts/[id]/comments/route.ts` | `POST /api/posts/:id/comments`；登录用户为公开帖子新增回复。               |
| `src/app/api/comments/[id]/route.ts`       | `PATCH/DELETE /api/comments/:id`；作者编辑或删除自己的回复。               |
| `src/app/api/profile/route.ts`             | `PATCH /api/profile`；仅修改当前用户的昵称。                               |
| `src/app/api/admin/moderate/route.ts`      | `POST /api/admin/moderate`；管理员通过数据库 RPC 隐藏或恢复帖子/回复。     |
| `src/app/api/cron/sync-draws/route.ts`     | `GET /api/cron/sync-draws`；检查 Bearer 密钥，调用官方数据同步并返回结果。 |

### 4.4 共用界面、文案与基础工具

| 文件                           | 作用                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `src/components/providers.tsx` | 中英文状态、语言持久化、当前用户状态和 `t(中文,英文)` 翻译函数。                   |
| `src/components/shell.tsx`     | 顶部导航、手机导航、页脚及语言切换等全站外壳。                                     |
| `src/components/ui.tsx`        | 可复用的页面标题组件。                                                             |
| `src/messages/navigation.ts`   | 导航和学历选项的中英文词条；页面专用文案通常放在使用处。                           |
| `src/lib/env.ts`               | 判断是否配置 Supabase，并读取、检查公钥配置。                                      |
| `src/lib/browser-storage.ts`   | 安全读取浏览器 `localStorage/sessionStorage` 的 React Hook，避免服务端渲染不一致。 |
| `src/lib/api.ts`               | 写入接口共用的登录、同源 Origin、输入大小、错误响应处理。                          |
| `src/lib/supabase/browser.ts`  | 浏览器端使用公钥的 Supabase 客户端。                                               |
| `src/lib/supabase/server.ts`   | 服务端使用用户 Cookie 的 Supabase 客户端。                                         |
| `src/lib/supabase/admin.ts`    | 只在服务端使用 service-role 密钥的客户端，供数据同步调用。                         |
| `src/proxy.ts`                 | Next.js Proxy：在匹配的请求中刷新/传递 Supabase 登录 Cookie。                      |

### 4.5 抽选模块：`src/features/draws`

| 文件                               | 作用                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `src/features/draws/adapter.ts`    | IRCC JSON 地址、内部 `Draw` 类型、Zod 数据校验、原始字段转换与简短类别名称。        |
| `src/features/draws/sync.ts`       | 同步流程编排：获取官方数据、调用整批导入函数、失败时记日志；与具体数据库 SDK 解耦。 |
| `src/features/draws/repository.ts` | 服务端抽选读取：预览模式用 JSON 快照；数据库模式读 `draws` 和 `data_status`。       |
| `src/features/draws/chart.tsx`     | 使用 Recharts 绘制同类抽选趋势与个人 CRS 参考线。                                   |
| `src/features/draws/dashboard.tsx` | 首页统计卡片、数据时间状态、近期讨论和首页抽选区。                                  |
| `src/features/draws/explorer.tsx`  | 抽选类别、时间和日期筛选，图表、分页表格、官方来源链接。                            |
| `src/data/draws.json`              | 2026-09-18 获取的 445 条官方历史数据快照；供无数据库预览使用。                      |
| `scripts/fetch-snapshot.ts`        | 运行 `npm run snapshot` 时重新获取官方 JSON 并生成上述快照文件。                    |

### 4.6 CRS 模块：`src/features/crs`

| 文件                                 | 作用                                                                |
| ------------------------------------ | ------------------------------------------------------------------- |
| `src/features/crs/schema.ts`         | Zod 申请人输入格式、类型与标注为示例的默认值。                      |
| `src/features/crs/rules.ts`          | 规则版本、官方来源、学历/年龄/加拿大经验等评分表。                  |
| `src/features/crs/language-tests.ts` | IRCC 认可语言考试的原始成绩到 CLB/NCLC 的纯函数换算表。             |
| `src/features/crs/calculate.ts`      | 与 React 无关的纯评分函数；计算核心、配偶、技能转移、附加分与明细。 |
| `src/features/crs/calculator.tsx`    | 四步填写页面、输入错误显示、计算结果和加入历史比较的交互。          |

### 4.7 账户与社区模块

| 文件                                   | 作用                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `src/features/auth/account.tsx`        | 登录、注册、忘记/更新密码、退出、修改昵称、显示个人帖子。                       |
| `src/features/forum/schema.ts`         | 帖子/回复的 Zod 校验、类型和主题；官方引用必须为安全的 `canada.ca` HTTPS 链接。 |
| `src/features/forum/demo.ts`           | 预览模式下的三个**虚构**示例帖子。                                              |
| `src/features/forum/repository.ts`     | 服务端读取帖子/回复；预览时读示例，数据库模式读 Supabase。                      |
| `src/features/forum/forum.tsx`         | 论坛组件的统一导出入口，方便页面导入。                                          |
| `src/features/forum/content-badge.tsx` | 区分官方来源、个人经历、一般讨论的标签。                                        |
| `src/features/forum/notices.tsx`       | 未配置数据库或未登录时的说明页面。                                              |
| `src/features/forum/post-list.tsx`     | 帖子列表、主题筛选和空结果状态。                                                |
| `src/features/forum/post-detail.tsx`   | 帖子正文、来源链接、回复列表和回复/删除交互。                                   |
| `src/features/forum/post-editor.tsx`   | 新建/编辑帖子表单、输入校验和提交接口调用。                                     |
| `src/features/forum/admin.tsx`         | 管理员审核列表、隐藏/恢复按钮、同步记录显示。                                   |

### 4.8 数据库与测试

| 文件                                         | 作用                                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/001_initial.sql`        | 八张表、索引、RLS 策略、列级授权、注册触发器、发帖限频、审核 RPC 和事务导入 RPC。                         |
| `supabase/migrations/002_crs_rules_2026.sql` | 保存 2026 年复核后的 CRS 规则版本、来源与语言换算说明。                                                   |
| `tests/crs.test.ts`                          | CRS 的独立预期分数、年龄边界、配偶、语言、附加分和封顶测试。                                              |
| `tests/language-tests.test.ts`               | 五种认可语言考试换算的阈值、边界和异常低分测试。                                                          |
| `tests/sync.test.ts`                         | 官方 JSON 解析、异常批次、重复编号、网络失败和同步逻辑测试。                                              |
| `tests/permissions.test.ts`                  | HTTP 写入、管理员、Cron 和官方引用来源等边界测试。                                                        |
| `tests/database.test.ts`                     | 用 PGlite 执行真实 PostgreSQL 迁移，验证 RLS、作者权限、管理员、隐藏和事务回滚。                          |
| `tests/e2e/public.spec.ts`                   | Playwright 脚本：中英文、432 分流程、筛选、预览写入提示和窄屏布局；脚本已写，CLI 套件尚未计入已执行测试。 |

### 4.9 不属于源码交付的本机文件

`node_modules/` 是安装的第三方包，`.next/` 是构建/开发生成物，`*.tsbuildinfo` 是 TypeScript 缓存，`.DS_Store` 是 macOS 文件夹元数据，`playwright-report/` 和 `test-results/` 是浏览器测试输出。它们受 `.gitignore` 管理，不需要逐个讲解或提交。`.env.local` 用于保存本机真实密钥，不能提交。

## 5. 已验证的结果与尚未验证的部分

2026-10-01 在当前工作区重新执行：

| 检查                      | 结果         | 说明                                                                  |
| ------------------------- | ------------ | --------------------------------------------------------------------- |
| `npm test`                | 通过         | 5 个测试文件、61 项测试。                                             |
| `npm run typecheck`       | 通过         | TypeScript 静态检查。                                                 |
| `npm run lint`            | 通过         | ESLint。                                                              |
| `npm run format:check`    | 通过         | Prettier。                                                            |
| `npm run build`           | 通过         | 本次使用 Next.js 官方支持的 Webpack 构建选项；已写入 `package.json`。 |
| Playwright CLI            | 尚未重新运行 | 脚本存在；此前人工浏览器检查过桌面和手机核心流程。                    |
| 真实 Supabase/Auth/Vercel | 尚未验收     | 本地环境变量不能替代 Auth、RLS、邮件与云端部署的端到端验证。           |

本次核对时，Next.js 默认 Turbopack 构建在当前运行环境因“创建进程/绑定端口被禁止”失败；改用 Next.js 支持的 `next build --webpack` 后构建成功。这说明当前项目可以生成生产构建，但不能据此声称 Turbopack 构建或 Vercel 部署已经通过。

**测试的含义：** PGlite 运行的是 PostgreSQL SQL/RLS 逻辑，能证明迁移和策略在模拟用户身份下的行为；它不能替代 Supabase 托管 Auth、邮件、PostgREST、真实 Cookie 或 Vercel Cron 的线上验收。23 项 CRS 规则测试和 7 项语言换算测试覆盖了主要规则，但没有穷举每种输入组合，也没有把所有结果逐项与 IRCC 在线计算器比对。

## 6. 尚待完成的工作，按答辩影响排序

1. **接入真正的 Supabase 项目。** 执行 `001_initial.sql`，填写环境变量，确认八张表、RLS 和服务端密钥正常。接入步骤见 `docs/SETUP.md`。
2. **完成真实账户流程。** 实测注册邮件、确认回调、登录、退出、密码重置，并用两个账户验证作者不能修改他人内容。
3. **首次导入与同步验收。** 用正确的 `CRON_SECRET` 手动导入 IRCC 历史数据；检查重复执行、失败留存和管理页日志。
4. **部署与定时任务。** 在 Vercel 设置环境变量、Supabase 正式回调 URL，验证公开页面和每日 Cron 实际触发。目前没有公开 URL。
5. **运行浏览器自动化与可访问性复核。** 运行 Playwright 桌面/手机脚本，并在真实设备上核对键盘、屏幕阅读器及邮件回调体验。
6. **持续维护数据与政策。** 快照停留在 2026-09-18；IRCC 数据结构、抽选记录或 CRS 规则变化时，需要核验官方页面、更新适配器/规则版本并补测试。当前抽选数据库读取上限为 1000 条、社区列表为最近 100 条，增长后需要服务端分页。

上述事项中，前四项直接决定“真实用户可用”的范围。答辩时可以展示本地预览和代码，但应如实说明云端账户、论坛持久化和自动同步还没有被实际证明。

## 7. 建议的答辩演示与常见问题

### 5 分钟演示顺序

1. 首页说明“官方快照获取时间”，展示最近抽选和 CEC 趋势。
2. 进入历史页，切换 CEC/PNP、时间范围，打开一条 IRCC 来源，说明不同类别不混线。
3. 进入 CRS 计算器，使用默认示例算出 432 分，展示分项、规则版本，再加入历史图表参考线。
4. 进入社区，指出示例帖子有明确标记，解释配置 Supabase 后的真实发帖路径。
5. 展示 `calculate.ts`、`adapter.ts`、`repository.ts`、`001_initial.sql`，说明业务逻辑、来源切换、权限分别在哪一层。

### 可以怎样回答关键问题

**为什么 CRS 不由服务器计算？** 纯 TypeScript 函数在浏览器运行即可给出结果，减少敏感个人背景上传；输入只保存在当前页面状态，总分按用户动作暂存于当前会话。

**抽选数据可靠吗？** 数据来自 IRCC 官方 JSON，适配器检查日期、编号、邀请人数和分数，并保留每条来源链接。预览快照有明确获取时间，不宣称实时。

**为什么需要 RLS？** 只在页面隐藏编辑按钮挡不住直接请求 API。RLS 和列级授权让数据库根据登录身份约束作者、隐藏状态和管理员角色。

**同步失败会怎样？** 解析失败或数据库事务失败不覆盖已有有效抽选；系统记录失败时间并继续显示上次成功导入的数据。真实云端行为仍需接入后验收。

**现在算“完成”吗？** 作为可展示的本地课程原型，主要页面与评分、历史数据、社区/账户后端代码和数据库脚本已经完成；作为可公开服务的成品，还欠 Supabase 接入、真实账户与同步验收、Vercel 部署。

**哪里看更详细的步骤？** `README.md` 是入口，`docs/ARCHITECTURE.md` 讲设计，`docs/TESTING.md` 讲证据，`docs/SETUP.md` 讲接入和部署。
