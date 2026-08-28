# bbbook

Kindle 管理平台 monorepo。

## 结构

- `apps/web`：Vite + React 前端，仿真 Kindle 界面与电子墨水效果
- `apps/api`：Hono + Effect 后端 API
- `packages/kindle-sdk`：面向越狱 Kindle 的 TypeScript SDK（ssh2 / Effect）
- `packages/shared-types`：跨包共享类型

## 快速开始

```bash
pnpm install
pnpm dev
```

- 前端：http://localhost:5173
- API：http://localhost:3000
