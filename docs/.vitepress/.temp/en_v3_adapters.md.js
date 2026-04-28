import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Adapters","description":"","frontmatter":{},"headers":[],"relativePath":"en/v3/adapters.md","filePath":"en/v3/adapters.md","lastUpdated":null}');
const _sfc_main = { name: "en/v3/adapters.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="adapters" tabindex="-1">Adapters <a class="header-anchor" href="#adapters" aria-label="Permalink to &quot;Adapters&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04"
  }, null, _parent));
  _push(`<p>The v3.1 release line can target Node, Bun, Deno, Cloudflare, AWS Lambda, Netlify, Azure and Vercel.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/v3/adapters.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const adapters = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  adapters as default
};
