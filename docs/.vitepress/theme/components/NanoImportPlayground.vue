<script setup lang="ts">
import { ref } from 'vue';

const mode = ref<'bundle' | 'subpath'>('subpath');

const snippets = {
  bundle: `import { cors, requestId, secureHeaders } from 'nano/middlewares';`,
  subpath: `import { cors } from 'nano/middlewares/cors';
import { requestId } from 'nano/middlewares/request-id';
import { secureHeaders } from 'nano/middlewares/secure-headers';`,
} as const;
</script>

<template>
  <div class="nano-card playground">
    <div class="playground-head">
      <div>
        <strong>Import Strategy Demo</strong>
        <p>在应用内快速比较聚合导入和细粒度子模块导入。</p>
      </div>
      <div class="playground-actions">
        <button
          :class="{ active: mode === 'bundle' }"
          @click="mode = 'bundle'"
        >
          Bundle
        </button>
        <button
          :class="{ active: mode === 'subpath' }"
          @click="mode = 'subpath'"
        >
          Subpath
        </button>
      </div>
    </div>
    <pre><code>{{ snippets[mode] }}</code></pre>
  </div>
</template>

<style scoped>
.playground {
  margin: 28px 0;
  padding: 20px;
}

.playground-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.playground-head p {
  margin: 6px 0 0;
  color: var(--vp-c-text-2);
}

.playground-actions {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.playground-actions button {
  border: 1px solid rgba(15, 118, 110, 0.16);
  background: transparent;
  color: var(--vp-c-text-2);
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  font: inherit;
  cursor: pointer;
}

.playground-actions button.active {
  background: #0f766e;
  color: #fff;
  border-color: #0f766e;
}

pre {
  margin: 0;
  overflow: auto;
  border-radius: 16px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.96);
  color: #dbeafe;
}

code {
  white-space: pre-wrap;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .playground-head {
    flex-direction: column;
  }
}
</style>
