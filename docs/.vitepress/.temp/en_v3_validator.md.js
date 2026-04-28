import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Validator","description":"","frontmatter":{},"headers":[],"relativePath":"en/v3/validator.md","filePath":"en/v3/validator.md","lastUpdated":null}');
const _sfc_main = { name: "en/v3/validator.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="validator" tabindex="-1">Validator <a class="header-anchor" href="#validator" aria-label="Permalink to &quot;Validator&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04"
  }, null, _parent));
  _push(`<p>The v3.1 validator layer supports <code>json</code>, <code>form</code>, <code>query</code>, <code>param</code>, <code>header</code>, <code>cookie</code> and <code>text</code>, plus zod integration.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/v3/validator.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const validator = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  validator as default
};
