import { _ as _export_sfc, C as resolveComponent, o as openBlock, c as createElementBlock, ae as createStaticVNode, E as createVNode } from "./chunks/framework.D-vLbpTf.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","hero":{"name":"orva","text":"A production-ready Fetch API web framework","tagline":"Keep a Hono-like mental model while shipping typed middleware, validator, RPC, OpenAPI, and multi-runtime adapters in one cohesive server stack.","actions":[{"theme":"brand","text":"Start in 5 minutes","link":"/en/guide/quickstart"},{"theme":"alt","text":"Production guide","link":"/en/guide/production"},{"theme":"alt","text":"Middleware catalog","link":"/en/middlewares"},{"theme":"alt","text":"GitHub","link":"https://github.com/jieceng/orva"}]},"features":[{"title":"Small core, explicit exports","details":"The root entry stays focused on the framework core. RPC, adapters, middlewares, validator, and openapi ship through subpaths that are easier to tree-shake and publish."},{"title":"End-to-end type flow","details":"app.use() accumulation, validator output, RPC input inference, and OpenAPI metadata can move through the same contract chain instead of drifting apart."},{"title":"Ready for deployment","details":"Node, Bun, Deno, Cloudflare, Vercel, Netlify, Azure, and AWS Lambda are covered, with common middleware for auth, security headers, rate limits, static assets, cookies, and compression."}]},"headers":[],"relativePath":"en/index.md","filePath":"en/index.md","lastUpdated":1777355279000}');
const _sfc_main = { name: "en/index.md" };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_OrvaContractPipeline = resolveComponent("OrvaContractPipeline");
  return openBlock(), createElementBlock("div", null, [
    _cache[0] || (_cache[0] = createStaticVNode("", 3)),
    createVNode(_component_OrvaContractPipeline),
    _cache[1] || (_cache[1] = createStaticVNode("", 8))
  ]);
}
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export {
  __pageData,
  index as default
};
