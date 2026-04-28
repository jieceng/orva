import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"FAQ","description":"","frontmatter":{},"headers":[],"relativePath":"en/guide/faq.md","filePath":"en/guide/faq.md","lastUpdated":1777355210000}');
const _sfc_main = { name: "en/guide/faq.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="faq" tabindex="-1">FAQ <a class="header-anchor" href="#faq" aria-label="Permalink to &quot;FAQ&quot;">​</a></h1><h2 id="how-does-orva-relate-to-hono-and-express" tabindex="-1">How does <code>orva</code> relate to Hono and Express <a class="header-anchor" href="#how-does-orva-relate-to-hono-and-express" aria-label="Permalink to &quot;How does \`orva\` relate to Hono and Express&quot;">​</a></h2><p><code>orva</code> feels closer to Hono in day-to-day usage because it keeps a Fetch-style request model and a context-driven API. Compared with both Hono and Express, it puts more emphasis on:</p><ul><li>a smaller root entry with explicit subpath exports</li><li>app-level type accumulation</li><li>validator, RPC, and OpenAPI contract linkage</li><li>fine-grained middleware packaging</li></ul><h2 id="can-it-be-used-commercially" tabindex="-1">Can it be used commercially <a class="header-anchor" href="#can-it-be-used-commercially" aria-label="Permalink to &quot;Can it be used commercially&quot;">​</a></h2><p>Yes. The project uses the MIT license and is suitable for commercial and internal use.</p><h2 id="why-keep-rpc-adapters-and-middlewares-out-of-the-root-entry" tabindex="-1">Why keep RPC, adapters, and middlewares out of the root entry <a class="header-anchor" href="#why-keep-rpc-adapters-and-middlewares-out-of-the-root-entry" aria-label="Permalink to &quot;Why keep RPC, adapters, and middlewares out of the root entry&quot;">​</a></h2><p>That is intentional:</p><ul><li>less root-entry bloat</li><li>better tree-shaking behavior</li><li>clearer boundaries for templates and ecosystem packages</li></ul><p>See <a href="/en/exports">Exports</a>.</p><h2 id="what-should-i-migrate-first" tabindex="-1">What should I migrate first <a class="header-anchor" href="#what-should-i-migrate-first" aria-label="Permalink to &quot;What should I migrate first&quot;">​</a></h2><p>Recommended order:</p><ol><li>routes and context</li><li>shared middleware</li><li>validator</li><li>RPC and OpenAPI</li></ol></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/guide/faq.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const faq = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  faq as default
};
