<script setup lang="ts">
withDefaults(defineProps<{
  version: string;
  channel?: string;
  updated?: string;
  summary?: string;
}>(), {
  channel: 'Snapshot',
  updated: '',
  summary: '',
});
</script>

<template>
  <div class="nano-card version-banner">
    <div class="version-badge">
      {{ version }}
    </div>
    <div class="version-main">
      <strong>{{ channel }}</strong>
      <p v-if="summary">{{ summary }}</p>
      <span v-if="updated">Updated: {{ updated }}</span>
    </div>
  </div>
</template>

<style scoped>
.version-banner {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 16px;
  align-items: center;
  margin: 24px 0;
  padding: 18px;
}

.version-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  border-radius: 16px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #fff;
  background: linear-gradient(135deg, #0f766e, #0ea5e9);
}

.version-main p,
.version-main span {
  margin: 6px 0 0;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .version-banner {
    grid-template-columns: 1fr;
  }
}
</style>
