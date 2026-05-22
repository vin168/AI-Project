# 情绪账本后端部署（Alibaba Cloud Linux 3 / OpenAnolis，MySQL 5.7 + Node 18）

适用环境：
- OS：Alibaba Cloud Linux 3（RHEL/CentOS 8 系）
- Node.js：v18.x（已安装）
- MySQL：5.7（已安装）

目标：
- 后端服务对外提供 `https://stunningvin.abrdns.com/api/v1/*`
- 小程序端 `baseUrl` 指向该 HTTPS 域名

---

## 0. 前置清单（必须准备）

- 一个备案并可解析到服务器的域名（微信小程序“request 合法域名”通常要求 HTTPS 域名）
- DNS 解析：将 `stunningvin.abrdns.com` 的 A 记录指向你的服务器公网 IP（例如 `47.116.42.109`）
- 微信小程序后台拿到：`WX_APPID`、`WX_SECRET`
- 阿里云安全组放行：80、443（用于签证书/HTTP->HTTPS）

> 如果你暂时只有 IP（例如 `47.116.42.109`），开发者工具里可勾选“不校验合法域名”联调；但想真机/上线稳定使用，建议尽快上域名 + HTTPS。

---

## 1. 初始化数据库

你仓库脚本在：`docs/backend/mysql-schema1.sql`，其中写的是 `USE appdb;`。

两种方式二选一：

### 方式 A：直接用 appdb（推荐，最省事）

1) 创建库并导入：

```sql
CREATE DATABASE IF NOT EXISTS appdb DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE appdb;
```

然后执行 `mysql-schema1.sql` 全量导入。

2) 后端 `.env` 里设置 `DB_NAME=appdb`。

### 方式 B：改脚本库名

把 `mysql-schema1.sql` 里 `USE appdb;` 改成你要用的库名（例如 `emotion_account`），并确保 `.env` 的 `DB_NAME` 一致。

---

## 2. 配置后端环境变量

在服务器上进入后端目录（项目的 `server/`）：

- 复制 `.env.example` 为 `.env`
- 填写这些关键项：

```env
PORT=3000
JWT_SECRET=替换成强随机字符串
JWT_EXPIRES_IN=7d
WX_APPID=你的小程序appid
WX_SECRET=你的小程序secret
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=你的mysql用户
DB_PASSWORD=你的mysql密码
DB_NAME=appdb
```

说明：
- `JWT_SECRET` 必须改，建议 32+ 位随机串。
- `WX_APPID/WX_SECRET` 必须是同一个小程序的。

---

## 3. 安装依赖并启动

在 `server/` 目录：

```bash
npm install
node src/app.js
```

验证：
- `http://127.0.0.1:3000/health` 应返回 `code:0`。

---

## 4. 用 PM2 常驻运行（推荐）

安装并启动：

```bash
npm i -g pm2
pm2 start src/app.js --name emotion-account
pm2 status
pm2 logs emotion-account
```

开机自启（按提示执行即可）：

```bash
pm2 startup
pm2 save
```

---

## 5. 配置 Nginx 反向代理 + HTTPS

### 5.1 安装 Nginx

RHEL 系常用：

```bash
sudo dnf install -y nginx
sudo systemctl enable --now nginx
```

### 5.2 配置站点反代到 Node(3000)

创建一个 Nginx 配置（示例：`/etc/nginx/conf.d/emotion-account.conf`）：

```nginx
server {
  listen 80;
  server_name stunningvin.abrdns.com;

  location / {
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_pass http://127.0.0.1:3000;
  }
}
```

检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 申请证书并开启 HTTPS

你可以选：

- certbot（Let’s Encrypt）
- 或者 Caddy（自动签证书，更省心，但你当前已用 Nginx 就用 certbot 更顺）

certbot 方式（示意，具体包名按系统仓库为准）：

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d stunningvin.abrdns.com
```

成功后 certbot 会自动帮你写 HTTPS server block，并把 80 跳转 443。

---

## 6. 小程序端需要改什么

1) 把小程序 `baseUrl` 改成你的 HTTPS 域名：

- 配置文件：`config/api.js`
- 示例：

```js
baseUrl: 'https://stunningvin.abrdns.com/api/v1'
```

2) 在微信公众平台配置“服务器域名”（request 合法域名）：
- 必须是 HTTPS 域名
- 填：`https://stunningvin.abrdns.com`

---

## 7. 常见坑

- 401（token 失效）：需要重新点击小程序里的“云备份”触发登录。
- 真机无法访问：多半是 `baseUrl` 还在 `127.0.0.1`，或没配合法域名，或没上 HTTPS。
- MySQL 外键/字符集报错：优先确认库是 `utf8mb4`、并在导入前 `SET FOREIGN_KEY_CHECKS=0`（脚本末尾也会恢复）。

---

## 8. 建议的上线顺序

1) 先把 Node 服务跑起来（仅本机 3000）并通过 `/health`
2) 再上 Nginx 反代，让外网能访问
3) 再加 HTTPS
4) 最后改小程序 `baseUrl` + 配置合法域名，真机测试登录/备份/恢复

---

## 附：用 systemd 管理 Node 进程（你当前选择）

仓库已准备好模板：`docs/deploy/emotion-account.service`。

步骤：

1) 把模板复制到服务器：

```bash
sudo cp /usr/vin_app/docs/deploy/emotion-account.service /etc/systemd/system/emotion-account.service
```

2) 编辑 unit 文件，把这几项改成你真实路径：

- `WorkingDirectory`
- `EnvironmentFile`
- `ExecStart`

3) 重新加载并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now emotion-account
sudo systemctl status emotion-account
```

4) 看日志：

```bash
sudo journalctl -u emotion-account -f
```

快速排错（服务起不来时优先看这里）：

```bash
sudo systemctl status emotion-account --no-pager -l
sudo journalctl -u emotion-account --no-pager -n 200
ls -l /usr/vin_app/server/src/app.js /usr/vin_app/server/.env
```

注意：
- 如果你启用了 unit 里的 hardening 选项但遇到权限问题，可先注释掉 `ProtectSystem/ProtectHome` 再试。
- 如果你的 unit 里写了 `EnvironmentFile=/usr/vin_app/server/.env` 且该文件不存在，systemd 会直接启动失败；建议使用 `EnvironmentFile=-/usr/vin_app/server/.env` 或先创建 `.env`。
