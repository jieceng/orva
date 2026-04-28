import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"nano v3.1","description":"","frontmatter":{},"headers":[],"relativePath":"en/v3/index.md","filePath":"en/v3/index.md","lastUpdated":null}');
const _sfc_main = { name: "en/v3/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="nano-v3-1" tabindex="-1">nano v3.1 <a class="header-anchor" href="#nano-v3-1" aria-label="Permalink to &quot;nano v3.1&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Snapshot",
    updated: "2026-04",
    summary: "This section is the frozen v3.1 docs line for existing projects and durable internal links."
  }, null, _parent));
  _push(`<h2 id="snapshot-notes" tabindex="-1">Snapshot notes <a class="header-anchor" href="#snapshot-notes" aria-label="Permalink to &quot;Snapshot notes&quot;">​</a></h2><ul><li>This snapshot tracks the <code>nano@3.1.x</code> release line.</li><li>New capability explanations continue in the current docs.</li><li>Existing teams can pin internal references to this versioned entrypoint.</li></ul><h2 id="entry-points" tabindex="-1">Entry points <a class="header-anchor" href="#entry-points" aria-label="Permalink to &quot;Entry points&quot;">​</a></h2><ul><li><a href="/en/v3/guide/introduction">Introduction</a></li><li><a href="/en/v3/guide/quickstart">Quickstart</a></li><li><a href="/en/v3/middlewares">Middleware</a></li><li><a href="/en/v3/validator">Validator</a></li><li><a href="/en/v3/rpc">RPC</a></li><li><a href="/en/v3/openapi">OpenAPI</a></li><li><a href="/en/v3/adapters">Adapters</a></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/v3/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
