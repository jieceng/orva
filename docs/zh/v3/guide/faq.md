# 常见问题

## `orva` 和 Hono、Express 的关系是什么

`orva` 的使用心智会让你感觉接近 Hono：同样是轻路由、Fetch API 风格、Context 驱动。但它更强调：

- 根入口只保留核心，子模块边界更明确
- `app.use()` 的类型累积模型
- RPC / OpenAPI / validator 的契约联动
- 中间件细粒度拆分与生态发布

和 Express 相比，`orva` 更接近现代 Web 平台接口，也更容易把类型、文档和客户端链路串起来。

## 能不能用于商用

可以。项目采用 MIT 许可证，适合商用、内部平台和对外服务场景。

## 会不会有版权或抄袭问题

框架 API 设计受到现代 Fetch 风格服务端框架启发是正常现象，但文档、实现、导出结构、中间件体系和契约能力都应以你当前项目仓库中的实际代码和许可证为准。只要保持：

- 明确自己的 LICENSE
- 不复制他人受版权保护的文档与实现
- 依赖遵守各自许可证

就可以以正常开源项目方式维护和发布。

## `orva` 现在更适合什么类型的项目

- API 服务
- 中后台 BFF
- 平台网关与治理层
- 需要 typed RPC / OpenAPI 的全栈团队
- 多运行时部署场景

## 如果只要 validator，能不能单独用第三方中间件

可以。如果团队已经有既定校验方案，完全可以只使用 `orva` 的路由与 Context，再接入自己的校验层。

但如果你希望把校验结果继续流向：

- `c.valid()`
- RPC 输入推导
- OpenAPI 参数 / requestBody 约束

那么使用 `orva/validator` 或 `orva/validator/zod` 会更顺手。

## 为什么根入口不导出 RPC、adapters、中间件

这是刻意设计。原因很直接：

- 避免根入口膨胀
- 保持 tree-shaking 友好
- 让生态包和模板能稳定依赖细粒度子路径

推荐方式见 [导出与子模块](/exports)。

## 为什么文档里强调细粒度子模块导入

因为这和 `orva` 的生态设计强相关：

- 应用代码可以用聚合导入，开发体验更顺
- 发布库、共享包、模板、CLI 场景更适合子路径导入

这能让最终包体、边界和可维护性更可控。

## 性能处在什么水平

`orva` 的目标是保持轻量请求路径，并在常见 GET / JSON / middleware 场景下接近同类 Fetch 风格框架，同时明显优于传统更重的 Node 风格路径。实际表现仍然取决于：

- 你的中间件栈深度
- 响应序列化量
- 平台适配器成本
- Node / Bun / Edge 运行时差异

建议用你的真实业务路由做基准，而不是只看单个 hello-world 数字。

## 迁移时优先迁什么

从现有服务迁移时，推荐顺序：

1. 先迁路由与 Context
2. 再迁通用中间件
3. 再接 validator
4. 最后接 RPC / OpenAPI

这样更容易控制风险，也便于逐步对比行为和性能。

## 文档推荐阅读顺序是什么

1. [快速开始](/zh/guide/quickstart)
2. [路由与组合](/zh/guide/routing)
3. [Context 与响应](/zh/guide/context)
4. [中间件与类型累积](/zh/guide/production)
5. [Validator](/zh/validator) / [RPC](/zh/rpc) / [OpenAPI](/zh/openapi)
6. [测试与质量](/zh/guide/testing)
7. [部署与运行时](/zh/guide/deployment)
