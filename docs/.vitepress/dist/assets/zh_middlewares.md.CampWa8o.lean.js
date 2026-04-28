import { _ as _export_sfc, C as resolveComponent, o as openBlock, c as createElementBlock, j as createBaseVNode, a as createTextVNode, E as createVNode, ae as createStaticVNode } from "./chunks/framework.D-vLbpTf.js";
const __pageData = JSON.parse('{"title":"中间件目录","description":"","frontmatter":{},"headers":[],"relativePath":"zh/middlewares.md","filePath":"zh/middlewares.md","lastUpdated":1777356459000}');
const _sfc_main = { name: "zh/middlewares.md" };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_OrvaMiddlewareMap = resolveComponent("OrvaMiddlewareMap");
  return openBlock(), createElementBlock("div", null, [
    _cache[0] || (_cache[0] = createBaseVNode("h1", {
      id: "中间件目录",
      tabindex: "-1"
    }, [
      createTextVNode("中间件目录 "),
      createBaseVNode("a", {
        class: "header-anchor",
        href: "#中间件目录",
        "aria-label": 'Permalink to "中间件目录"'
      }, "​")
    ], -1)),
    _cache[1] || (_cache[1] = createBaseVNode("p", null, [
      createBaseVNode("code", null, "orva"),
      createTextVNode(" 已经有比较完整的中间件层，但前提是这些能力得“找得到、看得懂、拿来就能用”。这页就是当前主线版本的完整目录：每个中间件都包含用途说明、子模块导入路径和最小示例。")
    ], -1)),
    createVNode(_component_OrvaMiddlewareMap, { locale: "zh" }),
    _cache[2] || (_cache[2] = createStaticVNode("", 54))
  ]);
}
const middlewares = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export {
  __pageData,
  middlewares as default
};
