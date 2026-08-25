# 2027 秋招版 JobTrack

本 Fork 在原 JobTrack 基础上新增：

- `/jobs`：市场营销 / 运营管理 / 管培生岗位池，读取 Supabase `job_listings`。
- `/progress`：个人申请进度，读取和更新 Supabase `application_progress`。
- 登录后默认进入 `/jobs`。
- 原 `/applications` 与 `/analytics` 功能保留。

## Supabase

需要在 Vercel 配置以下环境变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

当前秋招数据库使用 `job_listings` 与 `application_progress`，个人进度通过 RLS 按 `auth.uid()` 隔离。

## 数据同步

每周岗位更新只更新 `job_listings`，不清空或覆盖 `application_progress`。
