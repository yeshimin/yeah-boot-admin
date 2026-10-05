# yeah-boot-admin

`yeah-boot-admin` 是 yeah-boot 配套的 Vue 3 管理后台，提供动态菜单、角色权限、系统管理和基础能力管理等功能。

## 技术栈

- Vue 3.4
- TypeScript 5
- Vite 7
- Element Plus 2
- Pinia 2
- Vue Router 4
- Axios

## 已实现功能

- 登录、退出及登录状态恢复
- 首页、个人中心和头像维护
- 动态菜单、页面和按钮权限控制
- 视图资源、接口资源及接口挂载管理
- 用户、角色、组织、岗位和字典管理
- 地区、文件、存储和系统日志管理
- 用户 Excel 模板下载、批量导入和按条件或勾选导出
- 多页签、页签右键菜单和侧边栏折叠
- 登录失效、无权限及文件下载错误统一处理

## 权限模型

前端根据后端返回的资源树生成菜单和路由，并使用视图权限标识控制按钮等可见内容。

- 菜单、页面和按钮属于视图资源。
- 接口资源由后端鉴权。
- 视图资源可以挂载一个或多个接口资源。
- 角色授权管理以扁平资源 ID 鉴权，以挂载 ID 区分同一接口的多个展示位置。
- 首页和个人中心是所有已登录用户都可以访问的基础页面。

## 环境要求

- Node.js `^20.19.0 || >=22.12.0`

## 安装和启动

安装依赖：

```sh
npm install
```

启动本地开发服务：

```sh
npm run dev
```

## 检查和构建

类型检查：

```sh
npm run type-check
```

代码检查：

```sh
npm run lint
```

生产构建：

```sh
npm run build
```

## 主要目录

```text
src
├── api             后端接口封装
├── assets          静态资源
├── components      通用组件与布局组件
├── composables     组合式逻辑
├── constants       常量与资源类型定义
├── router          静态路由、动态路由及路由守卫
├── stores          Pinia 状态管理
├── types           TypeScript 类型
├── utils           请求、鉴权、文件和头像工具
└── views           登录、首页、个人中心和业务页面
```

## 文档

- [项目开发日志](./docs/PROJECT_LOG.md)
- [前端架构说明](./docs/ARCHITECTURE.md)

## 开发约定

- 页面展示权限使用视图权限标识判断，接口请求由后端执行最终鉴权。
- 新增业务页面时维护 API、类型和资源配置；仅内置系统页面需要补充静态路由组件映射。
- 通用交互优先复用已有请求、权限、下载和会话处理工具。
- 提交前至少执行类型检查和 ESLint 检查。

## 二次开发与升级

二次开发应将内置后台视为上游基线。项目业务优先按领域新增文件，避免直接修改认证、请求、路由和布局基础设施：

```text
src
├── api/<domain>.ts
├── types/<domain>.ts
└── views/<domain>/index.vue
```

- 业务页面、表单和领域组件放入 `src/views/<domain>/`。
- 接口调用集中到 `src/api/<domain>.ts`，类型放入 `src/types/<domain>.ts`。
- 后端资源配置中的组件路径使用 `<domain>/index`，页面路径避免使用保留的 `/system/**` 前缀。
- 页面按钮使用 `view:` 权限控制；后端接口仍配置独立的 `api:` 权限。

除通用缺陷修复外，不要将项目业务直接写入 `src/utils/request.ts`、`src/utils/auth.ts`、`src/stores/auth.ts`、`src/router/index.ts` 的系统路由映射或 `src/components/layout/`。这些文件属于框架基础设施，修改会显著增加后续合并上游版本的成本。

升级时先在独立分支合并上游，再恢复自定义的 `api`、`types`、`views` 与资源配置；随后执行类型检查、Lint、生产构建，并以完整权限和只读权限角色验证菜单、按钮和接口行为。

详细步骤见[新增业务页面](https://docs.yeahboot.com/frontend/new-page)、[请求与登录状态](https://docs.yeahboot.com/frontend/request-auth)和[新增业务模块](https://docs.yeahboot.com/backend/new-module)。
