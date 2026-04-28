import { _ as _export_sfc, C as resolveComponent, o as openBlock, c as createElementBlock, j as createBaseVNode, a as createTextVNode, E as createVNode, ae as createStaticVNode } from "./chunks/framework.D-vLbpTf.js";
const __pageData = JSON.parse('{"title":"Middleware Catalog","description":"","frontmatter":{},"headers":[],"relativePath":"middlewares.md","filePath":"middlewares.md","lastUpdated":1777356459000}');
const _sfc_main = { name: "middlewares.md" };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_OrvaMiddlewareMap = resolveComponent("OrvaMiddlewareMap");
  return openBlock(), createElementBlock("div", null, [
    _cache[0] || (_cache[0] = createBaseVNode("h1", {
      id: "middleware-catalog",
      tabindex: "-1"
    }, [
      createTextVNode("Middleware Catalog "),
      createBaseVNode("a", {
        class: "header-anchor",
        href: "#middleware-catalog",
        "aria-label": 'Permalink to "Middleware Catalog"'
      }, "​")
    ], -1)),
    _cache[1] || (_cache[1] = createBaseVNode("p", null, [
      createBaseVNode("code", null, "orva"),
      createTextVNode(" ships with a production-oriented middleware layer, but the ergonomics only matter if you can quickly find the right one. This page is the full catalog for the active release line: every middleware export, what it is for, where to import it from, and the smallest useful example.")
    ], -1)),
    createVNode(_component_OrvaMiddlewareMap, { locale: "en" }),
    _cache[2] || (_cache[2] = createStaticVNode("", 54))
  ]);
}
const middlewares = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export {
  __pageData,
  middlewares as default
};
