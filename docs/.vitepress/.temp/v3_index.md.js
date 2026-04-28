import { resolveComponent, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"nano v3.1","description":"","frontmatter":{},"headers":[],"relativePath":"v3/index.md","filePath":"v3/index.md","lastUpdated":null}');
const _sfc_main = { name: "v3/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NanoVersionBanner = resolveComponent("NanoVersionBanner");
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="nano-v3-1" tabindex="-1">nano v3.1 <a class="header-anchor" href="#nano-v3-1" aria-label="Permalink to &quot;nano v3.1&quot;">​</a></h1>`);
  _push(ssrRenderComponent(_component_NanoVersionBanner, {
    version: "v3.1",
    channel: "Snapshot",
    updated: "2026-04",
    summary: "这一组页面作为 v3.1 冻结快照保留，适合给已有项目、内部平台和历史链接使用。"
  }, null, _parent));
  _push(`<h2 id="快照说明" tabindex="-1">快照说明 <a class="header-anchor" href="#快照说明" aria-label="Permalink to &quot;快照说明&quot;">​</a></h2><ul><li>本快照对应 <code>nano@3.1.x</code> 文档线。</li><li>新特性说明将继续进入当前主线文档。</li><li>历史项目建议固定到该版本入口，避免团队文档跳转到最新行为。</li></ul><h2 id="入口" tabindex="-1">入口 <a class="header-anchor" href="#入口" aria-label="Permalink to &quot;入口&quot;">​</a></h2><ul><li><a href="/v3/guide/introduction">介绍</a></li><li><a href="/v3/guide/quickstart">快速开始</a></li><li><a href="/v3/middlewares">中间件</a></li><li><a href="/v3/validator">Validator</a></li><li><a href="/v3/rpc">RPC</a></li><li><a href="/v3/openapi">OpenAPI</a></li><li><a href="/v3/adapters">适配器</a></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("v3/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
