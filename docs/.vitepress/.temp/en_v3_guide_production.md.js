import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Middleware and Type Accumulation","description":"","frontmatter":{},"headers":[],"relativePath":"en/v3/guide/production.md","filePath":"en/v3/guide/production.md","lastUpdated":null}');
const _sfc_main = { name: "en/v3/guide/production.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="middleware-and-type-accumulation" tabindex="-1">Middleware and Type Accumulation <a class="header-anchor" href="#middleware-and-type-accumulation" aria-label="Permalink to &quot;Middleware and Type Accumulation&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04"
  }, null, _parent));
  _push(`<p>The v3.1 line already supports:</p><ul><li><code>app.use()</code> type accumulation</li><li>custom typed extensions through <code>defineMiddleware()</code></li><li>validator outputs flowing into downstream handlers</li><li>fine-grained <code>nano/middlewares/*</code> exports</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/v3/guide/production.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const production = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  production as default
};
