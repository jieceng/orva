import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"路由与组合","description":"","frontmatter":{},"headers":[],"relativePath":"v3/guide/routing.md","filePath":"v3/guide/routing.md","lastUpdated":null}');
const _sfc_main = { name: "v3/guide/routing.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="路由与组合" tabindex="-1">路由与组合 <a class="header-anchor" href="#路由与组合" aria-label="Permalink to &quot;路由与组合&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04"
  }, null, _parent));
  _push(`<p>v3.1 的路由模型保持：</p><ul><li><code>get/post/put/delete/patch/options/all</code></li><li><code>:param</code> 路径参数</li><li><code>*</code> 通配路径</li><li><code>group()</code> 分组</li><li><code>route()</code> 子应用挂载</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("v3/guide/routing.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const routing = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  routing as default
};
