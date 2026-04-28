import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Context 与响应","description":"","frontmatter":{},"headers":[],"relativePath":"v3/guide/context.md","filePath":"v3/guide/context.md","lastUpdated":null}');
const _sfc_main = { name: "v3/guide/context.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="context-与响应" tabindex="-1">Context 与响应 <a class="header-anchor" href="#context-与响应" aria-label="Permalink to &quot;Context 与响应&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04"
  }, null, _parent));
  _push(`<p>v3.1 上下文仍然统一暴露：</p><ul><li><code>c.req</code></li><li><code>c.url</code></li><li><code>c.params</code></li><li><code>c.query</code></li><li><code>c.set()</code> / <code>c.get()</code></li><li><code>c.valid()</code></li><li><code>c.text()</code> / <code>c.json()</code> / <code>c.html()</code> / <code>c.redirect()</code></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("v3/guide/context.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const context = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  context as default
};
