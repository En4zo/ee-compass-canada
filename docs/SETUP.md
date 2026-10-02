# Supabase 接入与 Vercel 部署

本次已完成本地项目，没有代你创建云账户或执行公开部署。以下步骤由你在自己的项目中执行。

## 1. 建立数据库

1. 在 Supabase 创建**新的独立项目**。
2. 打开 SQL Editor，按编号顺序执行 `supabase/migrations/001_initial.sql` 和 `002_crs_rules_2026.sql` 全文。
3. 检查 public 下出现 draws、profiles、posts、comments、admin_roles、crs_rule_versions、sync_runs、data_status 八张表，且全部启用 RLS。
4. 迁移只用于新项目，执行一次即可；不要在已有业务数据的项目中重复执行。

如果注册用户先于迁移创建，触发器不会补建旧用户昵称。请在新项目执行迁移后再注册；或由维护者补建对应 profiles 记录。

## 2. 填写本地环境变量

复制 `.env.example` 为 `.env.local`：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
CRON_SECRET=YOUR_RANDOM_SECRET
```

可以在 Supabase 项目的 Connect 或 API Keys 页面获取连接信息。publishable key 可公开用于受 RLS 保护的访问；secret key 会绕过 RLS，**只能放服务器环境**。不要给后两项添加 `NEXT_PUBLIC_` 前缀。项目也兼容旧版 `SUPABASE_SERVICE_ROLE_KEY`，但新项目应优先使用 `SUPABASE_SECRET_KEY`。`SUPABASE_JWKS_URL` 用于自行验证用户 JWT，本项目通过 Supabase 客户端管理会话，因此不需要配置。

生成 cron secret：

```bash
openssl rand -hex 32
```

不要提交 `.env.local`。修改配置后重新运行 `npm run dev`；云端的 `NEXT_PUBLIC_` 值修改后需要重新构建部署。

## 3. 配置注册和邮件

在 Supabase Auth 设置中：

- 启用 Email / Password 登录，并保留邮件确认。
- 本地 Site URL：`http://127.0.0.1:3000`。
- Redirect URLs 添加 `http://127.0.0.1:3000/auth/callback` 和 `http://127.0.0.1:3000/auth/callback?next=/account/reset`。
- 如果使用 localhost 或其他端口，回调必须匹配你浏览器实际使用的 origin。
- 保持默认基于 `ConfirmationURL` 的确认/重置邮件流程；本项目在 `/auth/callback` 交换 PKCE code。
- 在发起注册/重置的同一浏览器打开邮件，以保留 PKCE verifier。链接过期或换浏览器时，重新发起邮件流程。
- 邮件服务额度或收件人限制可能影响测试。需要公开使用时，按 Supabase 官方说明配置自己的 SMTP。

页面 `/account` 提供登录、注册、忘记密码；重置成功回到 `/account/reset` 设置新密码。

## 4. 首次导入抽选

应用启动后，用本地 Node 命令读取 `.env.local` 中的 secret，避免将真实密钥写进命令历史：

```bash
node --env-file=.env.local --input-type=module -e 'const r=await fetch("http://127.0.0.1:3000/api/cron/sync-draws",{headers:{Authorization:"Bearer "+process.env.CRON_SECRET}}); console.log(r.status,await r.text())'
```

成功返回 `ok: true` 和本次处理记录数。重复执行会更新同一编号，不增加重复记录。数据从官方来源实时获取；如果官方数据格式改变，系统会拒绝异常批次并保留已有数据。

未执行首次同步时，数据库模式显示空状态，不会自动填入本地快照。无需导入虚构帖子；真实社区从空白开始。

## 5. 指定管理员

先注册并确认需要设为管理员的账户，在 Auth Users 中复制其 UUID。然后在 SQL Editor 执行：

```sql
insert into public.admin_roles(user_id)
values ('REPLACE_WITH_USER_UUID')
on conflict do nothing;
```

该账户的“我的账户”页面会显示管理入口。管理员可访问 `/admin` 隐藏/恢复帖子和回复，并查看同步记录。普通用户没有修改 admin_roles 的权限。

## 6. Vercel 部署

1. 将项目源码放入你的 Git 仓库，不上传 node_modules、.next 或环境密钥。
2. 在 Vercel 导入仓库。若是课程项目总仓库，将 Root Directory 设为 `ee-compass-canada`。
3. 框架选择 Next.js，Build Command 使用 `npm run build`；安装命令使用 `npm ci`。
4. 在环境设置中填写上面的四个变量，至少用于 Production。
5. 完成部署后，把 Supabase Site URL 更新为正式 HTTPS 网站地址，并添加正式域名的两种回调 URL。保留本地回调用于开发。
6. `vercel.json` 已配置每天 **03:00 UTC** 调用同步路由；Vercel 的 CRON_SECRET 会作为 Bearer authorization 传入。实际触发精度受计划限制，不承诺分钟级更新。
7. 手动调用一次正式域名的同步接口，确认成功后查看 Cron 与函数日志。

本项目使用原生 Next.js 服务端功能，不能导出为纯静态站点替代真实后端。

## 7. 接入验收

- 使用两个账户 A/B：A 发帖，B 可以回复但不能编辑或删除 A 的帖子。
- A 修改昵称、编辑帖子和回复；确认刷新后数据保留。
- 未登录用户可读公开内容，但发帖接口返回 401。
- 管理员隐藏帖子后，退出登录刷新，帖子及其回复不再公开。
- 检查密码重置和确认邮件成功回跳，不仅测试“邮件发送成功”提示。
- 不带 secret 请求同步接口应返回 401；正确 secret 导入成功。
- 模拟 IRCC 不可用时保留已有记录并显示同步失败，修复后能再次成功。

参考：[Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)、[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[Vercel Cron](https://vercel.com/docs/cron-jobs)。
