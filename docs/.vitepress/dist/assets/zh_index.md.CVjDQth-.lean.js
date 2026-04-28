import { _ as _export_sfc, C as resolveComponent, o as openBlock, c as createElementBlock, j as createBaseVNode, a as createTextVNode, E as createVNode, ae as createStaticVNode } from "./chunks/framework.D-vLbpTf.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","hero":{"name":"orva","text":"商用可落地的 Fetch API Web 框架","tagline":"以接近 Hono 的使用方式，交付 typed middleware、validator、RPC、OpenAPI 和多运行时适配的一体化服务端能力。","actions":[{"theme":"brand","text":"5 分钟上手","link":"/zh/guide/quickstart"},{"theme":"alt","text":"生产实践","link":"/zh/guide/production"},{"theme":"alt","text":"中间件目录","link":"/zh/middlewares"},{"theme":"alt","text":"GitHub","link":"https://github.com/jieceng/orva"}]},"features":[{"title":"轻核心，不堆根导出","details":"根入口只保留核心 API。RPC、adapters、middlewares、validator、openapi 统一走子路径，适合 tree-shaking、模板拆分和生态发布。"},{"title":"类型链路可贯通","details":"app.use() 类型累积、validator 输出、RPC 输入推导、OpenAPI 元数据契约可以串成单链路，减少接口漂移和重复描述。"},{"title":"运行时覆盖完整","details":"覆盖 Node、Bun、Deno、Cloudflare、Vercel、Netlify、Azure、AWS Lambda，并提供 cookie、static、compress、安全头、认证、限流等常用能力。"}]},"headers":[],"relativePath":"zh/index.md","filePath":"zh/index.md","lastUpdated":1777356459000}');
const _sfc_main = { name: "zh/index.md" };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_OrvaContractPipeline = resolveComponent("OrvaContractPipeline");
  return openBlock(), createElementBlock("div", null, [
    _cache[0] || (_cache[0] = createBaseVNode("h2", {
      id: "为什么是-orva",
      tabindex: "-1"
    }, [
      createTextVNode("为什么是 orva "),
      createBaseVNode("a", {
        class: "header-anchor",
        href: "#为什么是-orva",
        "aria-label": 'Permalink to "为什么是 orva"'
      }, "​")
    ], -1)),
    _cache[1] || (_cache[1] = createBaseVNode("p", null, [
      createBaseVNode("code", null, "orva"),
      createTextVNode(" 的目标不是只做一层轻路由，而是给希望保持小心智负担的团队，一套可以直接交付线上服务的 TypeScript 服务端工作流：")
    ], -1)),
    _cache[2] || (_cache[2] = createBaseVNode("ul", null, [
      createBaseVNode("li", null, "路由、Context、Middleware 足够直观，不强迫引入复杂抽象。"),
      createBaseVNode("li", null, "validator、RPC、OpenAPI 共享路由与元数据，不需要多套接口描述。"),
      createBaseVNode("li", null, "导出结构清晰，适合多包仓库、CLI 模板、SDK、基建层复用。"),
      createBaseVNode("li", null, "对 Node 和主流 Serverless / Edge 平台都有稳定入口。")
    ], -1)),
    createVNode(_component_OrvaContractPipeline),
    _cache[3] || (_cache[3] = createStaticVNode("", 11))
  ]);
}
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export {
  __pageData,
  index as default
};
