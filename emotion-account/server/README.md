# 情绪账本后端服务

这是给微信小程序 `emotion-account` 配套的最小可用后端服务，当前已经实现：

- 微信登录 `POST /api/v1/auth/wx-login`
- 全量上传备份 `POST /api/v1/backup/full`
- 全量拉取备份 `GET /api/v1/backup/full`
- 增量推送 `POST /api/v1/sync/push`
- 增量拉取 `GET /api/v1/sync/pull`

## 1. 安装依赖

```bash
cd server
npm install
```

## 2. 初始化数据库

先执行 [../docs/backend/mysql-schema.sql](../docs/backend/mysql-schema.sql) 建库建表并写入默认数据。

## 3. 配置环境变量

复制 `.env.example` 为 `.env`，并按实际情况填写：

```env
PORT=3000
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d
WX_APPID=your-wechat-appid
WX_SECRET=your-wechat-secret
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=emotion_account
```

说明：

- `WX_APPID` 和 `WX_SECRET` 来自微信小程序后台
- `JWT_SECRET` 请改成自己的强随机字符串
- 若数据库不在本机，请改 `DB_HOST`

## 4. 启动服务

```bash
cd server
npm run dev
```

默认监听：`http://localhost:3000`

健康检查：

```bash
GET /health
```

## 5. 当前实现说明

### 登录

- 服务端调用微信 `jscode2session` 获取 `openid`
- 自动创建或更新用户表 `users`
- 返回 JWT token 供后续接口鉴权

### 全量备份

- 当前实现为覆盖式全量上传
- 只覆盖当前用户的记录、自定义分类、自定义情绪、预算
- 系统默认分类和系统默认情绪不会被删除

### 增量同步

- 当前按 `updated_at` 做变更拉取
- 当前按 `user_id + client_record_id` 做幂等 upsert
- 当前版本先保证可用，复杂冲突合并策略还没有展开

## 6. 建议的下一步

- 给接口补请求参数校验
- 增加 `GET /api/v1/user/me`
- 小程序前端接入登录和备份接口
- 增加操作日志和更严格的冲突处理