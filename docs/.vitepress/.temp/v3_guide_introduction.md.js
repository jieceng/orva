import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"介绍","description":"","frontmatter":{},"headers":[],"relativePath":"v3/guide/introduction.md","filePath":"v3/guide/introduction.md","lastUpdated":null}');
const _sfc_main = { name: "v3/guide/introduction.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="介绍" tabindex="-1">介绍 <a class="header-anchor" href="#介绍" aria-label="Permalink to &quot;介绍&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04",
    summary: "该页保留 v3.1 文档线的核心设计说明。"
  }, null, _parent));
  _push(`<p><code>nano v3.1</code> 以 Fetch API 为核心处理模型，提供：</p><ul><li>可组合路由与中间件</li><li><code>app.use()</code> 类型累积</li><li>validator / zod validator</li><li>typed RPC</li><li>OpenAPI 组件化输出</li><li>多运行时适配器</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("v3/guide/introduction.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const introduction = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  introduction as default
};
