<script setup lang="ts">
const props = withDefaults(defineProps<{
  locale?: 'en' | 'zh';
}>(), {
  locale: 'en',
});

const content = {
  en: {
    title: 'Jump By Category',
    hint: 'Every card links to a full section with imports, purpose, and usage examples.',
    cards: [
      { href: '#authentication', title: 'Authentication', count: '3', body: 'Basic, bearer, and API key auth for private dashboards and public APIs.' },
      { href: '#guards', title: 'Guards', count: '14', body: 'Method, payload, header, query, rate, host, origin, and bot-level request gates.' },
      { href: '#http-response', title: 'HTTP / Response', count: '14', body: 'Headers, CORS, redirects, validators, checksums, and response shaping.' },
      { href: '#observability', title: 'Observability', count: '11', body: 'Request IDs, logs, timing, client metadata, locale, and request body capture.' },
      { href: '#security-headers', title: 'Security Headers', count: '15', body: 'CSP, HSTS, COOP/COEP/CORP, X-* headers, and secure default bundles.' },
      { href: '#asset-delivery', title: 'Asset Delivery', count: '2', body: 'Static assets, SPA fallback, ETag support, and response compression.' },
      { href: '#cookie-utilities', title: 'Cookie Utilities', count: '4', body: 'Low-level cookie helpers for middleware, adapters, and custom auth flows.' },
    ],
  },
  zh: {
    title: '按分类跳转',
    hint: '每张卡片都会跳到完整章节，包含导入方式、用途说明和最小示例。',
    cards: [
      { href: '#authentication', title: '认证', count: '3', body: '覆盖 Basic、Bearer 和 API Key，适合后台、内部 API 和对外接口。' },
      { href: '#guards', title: '请求守卫', count: '14', body: '按方法、载荷、Header、Query、频率、来源和 User-Agent 做拦截。' },
      { href: '#http-response', title: 'HTTP / 响应处理', count: '14', body: '补响应头、CORS、重定向、校验器、摘要和响应修饰能力。' },
      { href: '#observability', title: '观测', count: '11', body: '请求 ID、日志、计时、客户端信息、语言和原始 body 收集。' },
      { href: '#security-headers', title: '安全头', count: '15', body: 'CSP、HSTS、COOP/COEP/CORP、X-* 系列和安全默认组合。' },
      { href: '#asset-delivery', title: '静态资源与传输', count: '2', body: '静态文件、SPA fallback、ETag 协同和压缩输出。' },
      { href: '#cookie-utilities', title: 'Cookie 工具', count: '4', body: '适合中间件、适配器和自定义认证流程的底层 cookie 工具函数。' },
    ],
  },
} as const;
</script>

<template>
  <div class="orva-section-shell">
    <div class="orva-section-head">
      <div>
        <h2>{{ content[props.locale].title }}</h2>
        <p>{{ content[props.locale].hint }}</p>
      </div>
    </div>

    <div class="orva-map-grid">
      <a
        v-for="card in content[props.locale].cards"
        :key="card.href"
        class="orva-map-card"
        :href="card.href"
      >
        <div class="orva-map-count">{{ card.count }}</div>
        <div class="orva-map-content">
          <h3>{{ card.title }}</h3>
          <p>{{ card.body }}</p>
        </div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.orva-section-shell {
  margin: 28px 0 34px;
  padding: 22px;
  border-radius: 28px;
  border: 1px solid rgba(18, 58, 49, 0.12);
  background:
    radial-gradient(circle at top left, rgba(253, 186, 116, 0.18), transparent 28%),
    linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(248, 250, 252, 0.95));
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.dark .orva-section-shell {
  border-color: rgba(148, 163, 184, 0.16);
  background:
    radial-gradient(circle at top left, rgba(251, 146, 60, 0.14), transparent 28%),
    linear-gradient(180deg, rgba(18, 24, 38, 0.96), rgba(7, 11, 21, 0.94));
  box-shadow: 0 24px 72px rgba(2, 6, 23, 0.42);
}

.orva-section-head h2 {
  margin: 0;
  border: 0;
  padding: 0;
}

.orva-section-head p {
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
}

.orva-map-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.orva-map-card {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  text-decoration: none;
  color: inherit;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.72);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.dark .orva-map-card {
  border-color: rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.56);
}

.orva-map-card:hover {
  transform: translateY(-2px);
  border-color: rgba(15, 118, 110, 0.26);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.orva-map-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  border-radius: 16px;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f766e;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(234, 88, 12, 0.12));
}

.orva-map-content h3 {
  margin: 0 0 6px;
  font-size: 1rem;
}

.orva-map-content p {
  margin: 0;
  line-height: 1.64;
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .orva-map-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .orva-map-card {
    grid-template-columns: 1fr;
  }
}
</style>
