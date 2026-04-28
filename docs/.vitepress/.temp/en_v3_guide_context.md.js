import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Context and Responses","description":"","frontmatter":{},"headers":[],"relativePath":"en/v3/guide/context.md","filePath":"en/v3/guide/context.md","lastUpdated":null}');
const _sfc_main = { name: "en/v3/guide/context.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="context-and-responses" tabindex="-1">Context and Responses <a class="header-anchor" href="#context-and-responses" aria-label="Permalink to &quot;Context and Responses&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Stable snapshot",
    updated: "2026-04"
  }, null, _parent));
  _push(`<p>The v3.1 context still exposes:</p><ul><li><code>c.req</code></li><li><code>c.url</code></li><li><code>c.params</code></li><li><code>c.query</code></li><li><code>c.set()</code> / <code>c.get()</code></li><li><code>c.valid()</code></li><li><code>c.text()</code> / <code>c.json()</code> / <code>c.html()</code> / <code>c.redirect()</code></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/v3/guide/context.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const context = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  context as default
};
