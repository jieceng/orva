import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"OpenAPI","description":"","frontmatter":{},"headers":[],"relativePath":"en/v3/openapi.md","filePath":"en/v3/openapi.md","lastUpdated":null}');
const _sfc_main = { name: "en/v3/openapi.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="openapi" tabindex="-1">OpenAPI <a class="header-anchor" href="#openapi" aria-label="Permalink to &quot;OpenAPI&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04"
  }, null, _parent));
  _push(`<p>The v3.1 OpenAPI builder already supports reusable schemas, parameters, responses, request bodies, path items, headers, examples, links, callbacks and security schemes.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/v3/openapi.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const openapi = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  openapi as default
};
