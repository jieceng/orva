import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Deployment and Runtimes","description":"","frontmatter":{},"headers":[],"relativePath":"en/guide/deployment.md","filePath":"en/guide/deployment.md","lastUpdated":1777355210000}');
const _sfc_main = { name: "en/guide/deployment.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="deployment-and-runtimes" tabindex="-1">Deployment and Runtimes <a class="header-anchor" href="#deployment-and-runtimes" aria-label="Permalink to &quot;Deployment and Runtimes&quot;">​</a></h1><p><code>orva</code> keeps application code centered on <code>app.fetch(request)</code>. Platform differences live in adapters.</p><h2 id="platform-choices" tabindex="-1">Platform choices <a class="header-anchor" href="#platform-choices" aria-label="Permalink to &quot;Platform choices&quot;">​</a></h2><div class="orva-table-wrap"><table tabindex="0"><thead><tr><th>Target</th><th>Entry</th><th>Typical use</th></tr></thead><tbody><tr><td>Node.js</td><td><code>serveNode</code></td><td>regular APIs, containers, PM2, systemd</td></tr><tr><td>Bun</td><td><code>serveBun</code></td><td>Bun-native services</td></tr><tr><td>Deno</td><td><code>serveDeno</code></td><td>Deno-native HTTP apps</td></tr><tr><td>Cloudflare</td><td><code>createCloudflareWorker</code></td><td>edge APIs</td></tr><tr><td>Vercel</td><td><code>createAppRouteHandler</code></td><td>App Router and edge routes</td></tr><tr><td>AWS Lambda</td><td><code>createAWSLambdaHandler</code></td><td>API Gateway + Lambda</td></tr><tr><td>Netlify</td><td><code>createNetlifyFunctionHandler</code></td><td>functions and edge functions</td></tr><tr><td>Azure</td><td><code>createAzureFunctionHandler</code></td><td>Azure Functions</td></tr></tbody></table></div><p>See <a href="/en/adapters">Adapters</a> for the full matrix.</p><h2 id="deployment-rule-of-thumb" tabindex="-1">Deployment rule of thumb <a class="header-anchor" href="#deployment-rule-of-thumb" aria-label="Permalink to &quot;Deployment rule of thumb&quot;">​</a></h2><p>Keep business logic in <code>src/app.ts</code>, and keep each platform file as a thin adapter entrypoint.</p><h2 id="release-checklist" tabindex="-1">Release checklist <a class="header-anchor" href="#release-checklist" aria-label="Permalink to &quot;Release checklist&quot;">​</a></h2><ol><li><code>pnpm typecheck</code></li><li><code>pnpm test</code></li><li><code>pnpm build</code></li><li><code>pnpm docs:build</code></li><li>verify <code>exports</code> and package files</li></ol></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/guide/deployment.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const deployment = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  deployment as default
};
