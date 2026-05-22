# 情绪账本后端 API 设计

本文档覆盖当前最小可用后端能力：微信登录、全量上传备份、全量拉取备份、增量同步。

## 1. 基础约定

### 1.1 接口前缀

- 生产环境建议前缀：`/api/v1`
- 返回格式统一为 JSON

### 1.2 鉴权方式

- 登录成功后服务端返回 `accessToken`
- 后续接口在请求头中携带：`Authorization: Bearer <accessToken>`

### 1.3 通用返回结构

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

### 1.4 错误码建议

| code | 含义 |
| --- | --- |
| 0 | 成功 |
| 4001 | 参数错误 |
| 4002 | 登录失败 |
| 4003 | token 无效或过期 |
| 4004 | 数据不存在 |
| 4005 | 数据冲突 |
| 5000 | 服务端异常 |

## 2. 数据对象约定

### 2.1 Record 对象

```json
{
  "clientRecordId": "1713333333333_abcd123",
  "recordType": 1,
  "amount": "35.60",
  "categoryId": 1,
  "emotionId": 5,
  "note": "下班后买了奶茶",
  "occurredAt": "2026-04-17 20:35:10",
  "syncVersion": 3,
  "isDeleted": 0,
  "updatedAt": "2026-04-17 20:35:10"
}
```

字段说明：

- `recordType`: `1` 支出，`2` 收入
- `amount`: 字符串传输，避免浮点精度问题
- `clientRecordId`: 客户端唯一 ID，服务端按 `user_id + client_record_id` 保证幂等
- `isDeleted`: 逻辑删除标识，增量同步时必须保留

### 2.2 Category 对象

```json
{
  "id": 1001,
  "categoryType": 1,
  "name": "宠物",
  "icon": "🐈",
  "isSystem": 0,
  "updatedAt": "2026-04-17 20:35:10"
}
```

### 2.3 Emotion 对象

```json
{
  "id": 1001,
  "emotionType": 1,
  "name": "松弛开心",
  "icon": "😊",
  "color": "#F7A6B2",
  "description": "今天花得很轻松",
  "isSystem": 0,
  "updatedAt": "2026-04-17 20:35:10"
}
```

### 2.4 Budget 对象

```json
{
  "year": 2026,
  "month": 4,
  "budgetAmount": "2000.00",
  "updatedAt": "2026-04-17 20:35:10"
}
```

## 3. 登录接口

### 3.1 微信登录

- 方法：`POST /api/v1/auth/wx-login`
- 用途：客户端通过 `wx.login()` 拿到 `code`，服务端换取 `openid/session_key`，建立用户身份并签发 token

请求示例：

```json
{
  "code": "021xYabc0Zzzzz1ABCDEF",
  "userProfile": {
    "nickname": "Vin",
    "avatarUrl": "https://thirdwx.qlogo.cn/xxx",
    "gender": 1,
    "country": "China",
    "province": "Guangdong",
    "city": "Shenzhen"
  },
  "device": {
    "deviceCode": "wxapp_ios_abc123",
    "deviceName": "iPhone 15",
    "platform": "ios"
  }
}
```

返回示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "userId": 1,
    "openid": "oAbCdEf123456",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx",
    "expiresIn": 7200,
    "profile": {
      "nickname": "Vin",
      "avatarUrl": "https://thirdwx.qlogo.cn/xxx",
      "authStatus": 1
    }
  }
}
```

服务端处理要点：

- 调微信接口 `jscode2session` 获取 `openid`
- `openid` 不存在则创建用户，存在则更新用户资料和 `last_login_at`
- 同步写入 `user_devices`
- 返回 JWT 或自定义 token

## 4. 全量上传备份接口

### 4.1 上传整包备份

- 方法：`POST /api/v1/backup/full`
- 用途：客户端把当前本地完整数据覆盖式上传到云端，适合第一版快速上线

请求示例：

```json
{
  "clientBackupTime": "2026-04-17 21:00:00",
  "overwrite": true,
  "payload": {
    "records": [
      {
        "clientRecordId": "1713333333333_abcd123",
        "recordType": 1,
        "amount": "35.60",
        "categoryId": 1,
        "emotionId": 5,
        "note": "下班后买了奶茶",
        "occurredAt": "2026-04-17 20:35:10",
        "syncVersion": 1,
        "isDeleted": 0,
        "updatedAt": "2026-04-17 20:35:10"
      }
    ],
    "customCategories": [
      {
        "id": 1001,
        "categoryType": 1,
        "name": "宠物",
        "icon": "🐈",
        "updatedAt": "2026-04-17 20:30:00"
      }
    ],
    "customEmotions": [
      {
        "id": 1001,
        "emotionType": 1,
        "name": "松弛开心",
        "icon": "😊",
        "color": "#F7A6B2",
        "description": "今天花得很轻松",
        "updatedAt": "2026-04-17 20:31:00"
      }
    ],
    "budgets": [
      {
        "year": 2026,
        "month": 4,
        "budgetAmount": "2000.00",
        "updatedAt": "2026-04-17 20:32:00"
      }
    ]
  }
}
```

返回示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "backupId": 101,
    "serverTime": "2026-04-17 21:00:03",
    "recordCount": 128,
    "categoryCount": 3,
    "emotionCount": 2,
    "budgetCount": 1
  }
}
```

服务端处理要点：

- 开事务处理，保证整包一致性
- `overwrite=true` 时，仅覆盖当前用户的自定义分类、自定义情绪、预算、记录
- 系统默认分类和默认情绪不能删
- 记录表按 `user_id + client_record_id` 做 `upsert`
- 完成后写 `sync_logs`

## 5. 全量拉取备份接口

### 5.1 拉取整包数据

- 方法：`GET /api/v1/backup/full`
- 用途：新设备登录后，直接拉取当前用户完整云端数据并恢复本地

返回示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "serverTime": "2026-04-17 21:10:00",
    "payload": {
      "records": [],
      "customCategories": [],
      "customEmotions": [],
      "budgets": []
    }
  }
}
```

服务端处理要点：

- 只返回当前登录用户数据
- 默认分类、默认情绪可以不重复返回，由前端内置；也可以一起返回 `systemMeta`，两种都行
- 若你想减少前端改动，建议这里只返回用户自定义数据和用户记录

## 6. 增量同步接口

### 6.1 推送客户端增量变更

- 方法：`POST /api/v1/sync/push`
- 用途：把客户端自上次同步后的新增、修改、删除数据推送到服务端

请求示例：

```json
{
  "lastSyncTime": "2026-04-17 20:00:00",
  "changes": {
    "records": [
      {
        "clientRecordId": "1713333333333_abcd123",
        "recordType": 1,
        "amount": "35.60",
        "categoryId": 1,
        "emotionId": 5,
        "note": "下班后买了奶茶",
        "occurredAt": "2026-04-17 20:35:10",
        "syncVersion": 2,
        "isDeleted": 0,
        "updatedAt": "2026-04-17 20:35:10"
      }
    ],
    "customCategories": [],
    "customEmotions": [],
    "budgets": []
  }
}
```

返回示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "serverTime": "2026-04-17 21:15:00",
    "accepted": {
      "records": 1,
      "customCategories": 0,
      "customEmotions": 0,
      "budgets": 0
    }
  }
}
```

服务端处理要点：

- 以 `updatedAt` + `syncVersion` 作为冲突判断依据
- 若服务端版本更新，拒绝旧版本覆盖，返回冲突列表
- 删除动作必须走逻辑删除，不要物理删除

### 6.2 拉取服务端增量变更

- 方法：`GET /api/v1/sync/pull?since=2026-04-17%2020:00:00`
- 用途：客户端拉取服务端在指定时间之后的新增、修改、删除数据

返回示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "serverTime": "2026-04-17 21:16:00",
    "changes": {
      "records": [],
      "customCategories": [],
      "customEmotions": [],
      "budgets": []
    }
  }
}
```

服务端查询规则：

- `records.updated_at > since`
- `categories.updated_at > since and is_system = 0`
- `emotions.updated_at > since and is_system = 0`
- `monthly_budgets.updated_at > since`

## 7. 推荐的同步策略

第一阶段建议直接这么做：

1. 登录成功后，客户端保存 `accessToken`
2. 用户手动点“云备份”时调用 `POST /backup/full`
3. 用户在新设备上点“恢复”时调用 `GET /backup/full`
4. 等第一版稳定后，再接入 `sync/push` + `sync/pull` 做自动增量同步

这样最稳，开发成本最低，也最符合你当前小程序规模。

## 8. 建议补充接口

虽然你这次指定的是登录和同步四组接口，但为了后面前端接入更顺手，建议再补这两个：

### 8.1 获取当前用户信息

- 方法：`GET /api/v1/user/me`
- 用途：前端进入“我的”页面时展示昵称、头像、授权状态、最近同步时间

### 8.2 获取服务端元数据

- 方法：`GET /api/v1/meta/bootstrap`
- 用途：若未来默认分类或默认情绪也希望由服务端统一下发，可以增加该接口

## 9. 字段映射建议

当前前端字段和服务端字段建议这样映射：

| 前端字段 | 服务端字段 |
| --- | --- |
| id | clientRecordId |
| type: expense/income | recordType: 1/2 |
| amount | amount |
| categoryId | categoryId |
| emotionId | emotionId |
| note | note |
| createdAt | occurredAt |
| updatedAt | updatedAt |

这样你后面改小程序时，只需要在上传和拉取时做一层转换，不用大改现有本地数据结构。