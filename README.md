# 口袋世界 · 联机版

单文件 HTML5 小游戏 + 零依赖 Node.js 联机服务器。

## 文件

- `口袋世界-联机版.html`：游戏本体（单文件，浏览器直接打开即可单机游玩）
- `server.js`：联机服务器（只用 Node 内置模块：http / fs / path / crypto / os）
- `联机说明.md`：玩法与联机说明
- `package.json`：启动脚本与 Node 版本要求

## 本地运行

```bash
npm start
# 或
node server.js
```

默认监听 `0.0.0.0:3000`，可用环境变量 `PORT` / `HOST` 覆盖。

启动后本地访问 <http://localhost:3000/> 即为联机版游戏页；同一网络内其他设备可用 `http://<本机IP>:3000/` 加入。

## 部署到 Render

1. 在 Render 新建 **Web Service**，连接本仓库。
2. Runtime 选 **Node**，Build Command 留空，Start Command 填 `node server.js`。
3. 部署完成后，Render 会分配一个 `https://xxxx.onrender.com` 地址，浏览器打开即可联机。

> 免费实例在一段时间无访问后会休眠，首次打开可能需等待十几秒唤醒。
