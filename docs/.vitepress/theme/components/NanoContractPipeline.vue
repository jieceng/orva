<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';

const { lang } = useData();

const items = {
  en: [
    {
      title: 'Request',
      body: 'Every request enters through the Fetch API shape, and adapters only bridge host-specific request objects into that model.',
    },
    {
      title: 'Validator',
      body: 'JSON, form, query, param, header, cookie, and text inputs can all flow through one type-safe validation path.',
    },
    {
      title: 'Route',
      body: 'Context, middleware, and route composition stay readable, so business logic can stay concentrated inside handlers.',
    },
    {
      title: 'Contracts',
      body: 'Validation metadata can keep flowing into RPC and OpenAPI, reducing drift between runtime code, docs, and clients.',
    },
  ],
  zh: [
    {
      title: 'Request',
      body: '统一以 Fetch API Request 进入应用，平台适配器只负责把宿主请求桥接进来。',
    },
    {
      title: 'Validator',
      body: 'json / form / query / param / header / cookie / text 输入统一进入类型安全校验链。',
    },
    {
      title: 'Route',
      body: 'Context、Middleware、路由组合保持直观，业务逻辑集中在 handler 层。',
    },
    {
      title: 'Contracts',
      body: '校验元数据继续流向 RPC 与 OpenAPI，减少客户端、文档和运行时代码漂移。',
    },
  ],
} as const;

const localizedItems = computed(() => lang.value.startsWith('zh') ? items.zh : items.en);
</script>

<template>
  <div class="nano-card pipeline">
    <div
      v-for="(item, index) in localizedItems"
      :key="item.title"
      class="pipeline-item"
    >
      <div class="pipeline-index">
        0{{ index + 1 }}
      </div>
      <div class="pipeline-content">
        <h3>{{ item.title }}</h3>
        <p>{{ item.body }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pipeline {
  display: grid;
  gap: 14px;
  margin: 26px 0;
  padding: 18px;
}

.pipeline-item {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 14px;
  align-items: start;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.66);
}

.dark .pipeline-item {
  background: rgba(15, 23, 42, 0.55);
}

.pipeline-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border-radius: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #0f766e;
  background: rgba(15, 118, 110, 0.12);
}

.pipeline-content h3 {
  margin: 0 0 6px;
  font-size: 1rem;
}

.pipeline-content p {
  margin: 0;
  line-height: 1.68;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .pipeline-item {
    grid-template-columns: 1fr;
  }
}
</style>
