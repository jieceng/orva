import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"适配器","description":"","frontmatter":{},"headers":[],"relativePath":"v3/adapters.md","filePath":"v3/adapters.md","lastUpdated":null}');
const _sfc_main = { name: "v3/adapters.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="适配器" tabindex="-1">适配器 <a class="header-anchor" href="#适配器" aria-label="Permalink to &quot;适配器&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04"
  }, null, _parent));
  _push(`<p>v3.1 可直接部署到 Node、Bun、Deno、Cloudflare、AWS Lambda、Netlify、Azure 与 Vercel。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("v3/adapters.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const adapters = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  adapters as default
};
