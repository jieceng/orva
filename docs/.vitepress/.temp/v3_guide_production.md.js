import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"中间件与类型累积","description":"","frontmatter":{},"headers":[],"relativePath":"v3/guide/production.md","filePath":"v3/guide/production.md","lastUpdated":null}');
const _sfc_main = { name: "v3/guide/production.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="中间件与类型累积" tabindex="-1">中间件与类型累积 <a class="header-anchor" href="#中间件与类型累积" aria-label="Permalink to &quot;中间件与类型累积&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04"
  }, null, _parent));
  _push(`<p>v3.1 已支持：</p><ul><li><code>app.use()</code> 类型累积</li><li><code>defineMiddleware()</code> 自定义类型扩展</li><li>validator 输出向下游路由传播</li><li><code>nano/middlewares/*</code> 细粒度导出</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("v3/guide/production.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const production = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  production as default
};
