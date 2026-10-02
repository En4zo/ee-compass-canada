# EE Compass Canada

加拿大 Express Entry 信息整合平台。使用 **Next.js App Router、TypeScript、Supabase、Tailwind CSS 和 Recharts**，把抽选历史、CRS 自评和社区讨论连接起来。

项目默认中文，支持英文切换；未配置 Supabase 时也能运行。没有创建云服务账户，也没有公开部署。

## 1. 先把网站跑起来

需要 Node.js **22.12 或以上**，推荐 Node.js 24 LTS。

```bash
cd "/Users/enzuomou/Documents/nau mcit 2/ee-compass-canada"
npm ci
npm run dev
```

打开 [http://127.0.0.1:3000](http://127.0.0.1:3000)。如果端口被占用：`npm run dev -- --port 3001`。

**第一次无需填写任何密钥。** 当前预览可用：

- 总览与历史抽选：445 条 IRCC 官方历史记录，快照获取日期 2026-09-18。每条记录保留官方来源。
- CRS 计算器：四步表单、真实评分规则、分项明细，以及历史参考线。
- 论坛：明确标记的示例内容，可浏览但不会假装注册或发布成功。
- 中英双语、手机与桌面布局、加载和异常页面。

配置 Supabase 后，数据全部来自数据库；连接失败会显示错误，不会用示例数据掩盖故障。仅填一个 Supabase 配置项也视为配置错误，而非预览模式。

## 2. 如何阅读代码

```text
src/
  app/                 页面入口、布局、API 路由
  components/          导航、双语上下文、通用页面标题
  features/
    draws/             IRCC 数据适配、数据库读取、图表和筛选
    crs/               输入类型、规则表、纯函数评分、分步表单
    forum/             帖子列表、编辑、详情、审核、数据读取
    auth/              注册、登录、密码重置、账户管理
  lib/                 环境配置、浏览器存储、API 错误、Supabase 客户端
  messages/            共用双语导航和学历词条
  data/                可追溯的官方抽选快照
supabase/migrations/   数据表、权限策略、触发器和同步事务
scripts/              快照更新脚本
tests/               单元、接口、真实 PostgreSQL 权限和浏览器测试
 docs/                架构、接入部署和测试说明
```

建议阅读顺序：

1. `src/features/crs/schema.ts`：申请人输入数据是什么。
2. `src/features/crs/rules.ts` 和 `calculate.ts`：如何得到分数，与 React 无关。
3. `src/features/draws/adapter.ts`：官方数据如何转换为应用数据。
4. `src/features/draws/repository.ts`：预览与数据库读取如何切换。
5. `src/app/page.tsx`：页面如何组合业务模块。
6. `supabase/migrations/001_initial.sql`：权限为什么不能只靠隐藏按钮。

变量和函数使用英文命名，关键政策与权限边界有中文注释。通用词条放在 `messages`，页面独有的中英文文案以 `t("中文", "English")` 成对放在使用处，方便对照修改。论坛用户正文不自动翻译。

## 3. 接入真实账户与数据库

完整操作步骤见 [Supabase 与 Vercel 接入指南](docs/SETUP.md)。基本顺序为：

1. 创建一个新的 Supabase 项目。
2. 在 SQL Editor 执行 `supabase/migrations/001_initial.sql`。
3. 复制 `.env.example` 为 `.env.local`，填写项目 URL、publishable key、仅服务端使用的 secret key 和随机 `CRON_SECRET`。
4. 配置 Auth 的网站地址和回调地址，重启 Next.js。
5. 调用一次受保护同步接口，导入 IRCC 历史抽选。
6. 注册测试账户，验证发帖、回复、作者权限和邮件流程。

请不要把 service-role key 或 `CRON_SECRET` 发到聊天、写到前端、提交到 Git。环境文件已经忽略。

## 4. 评分与数据边界

- 规则版本：`IRCC-2026-06-22-reviewed-2026-10-01`。
- 语言既可直接输入 **CLB / NCLC 四项等级**，也可输入 IELTS General、CELPIP-General、PTE Core、TEF Canada 或 TCF Canada 原始成绩，由经过测试的纯函数按 IRCC 官方表自动换算。
- 无配偶、不随行配偶、配偶为加拿大公民/PR，按无随行配偶表计分。
- 包含教育、语言、加拿大及海外经验、配偶、技能转移、法语、省提名、加拿大教育、兄弟姐妹和技工资格；不含已取消的 job offer 加分。
- 技能转移合计最多 100 分，附加分最多 600 分，总分最多 1200 分。
- 输入不上传服务器、不与账户绑定。点击历史比较时，仅总分存入当前标签页的 `sessionStorage`；语言偏好存入 `localStorage`。
- 初始表单有**明确标记的示例值**，必须替换为实际情况。学历、工作经验及额外因素由使用者按官方条件确认；计算器不判断入池资格或发出邀请保证。
- 官方类别保留原始名称及版本，以免合并政策不同的抽选。`91a`、`91b` 等真实历史编号用文本保存。
- 历史比较不预测未来。快照模式不会自动更新；运行 `npm run snapshot` 可从 IRCC 刷新文件。真实数据库模式由每日 Cron 更新。

## 5. 检查与测试

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run format:check
```

`npm test` 包含本地 PostgreSQL/WASM（PGlite）实际执行的迁移与 RLS 测试，无需 Docker 或 Supabase 账户。它会建立独立内存数据库，不改动你的云数据库。

可选浏览器回归测试：

```bash
npx playwright install chromium
npm run test:e2e
```

这套浏览器测试按**未配置 Supabase 的预览模式**运行，提供桌面和手机两种视口。真实云端注册、邮件回调和 Cron 的验收步骤另见 [验证记录](docs/TESTING.md)。

生产运行：

```bash
npm run build
npm start
```

## 6. 项目资料

- [架构与数据流](docs/ARCHITECTURE.md)
- [项目状态、未完成事项与逐文件说明（答辩准备）](docs/PROJECT_STATUS_AND_FILE_GUIDE.md)
- [数据库接入与部署](docs/SETUP.md)
- [测试记录与接入后验收](docs/TESTING.md)
- [IRCC 抽选记录](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html)
- [IRCC CRS 标准](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html)

这是独立信息平台，不属于 IRCC。第一版不包含预测、付费咨询、资料上传、复杂推荐或移民申请提交。
