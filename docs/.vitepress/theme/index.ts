import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import NanoContractPipeline from './components/NanoContractPipeline.vue';
import NanoImportPlayground from './components/NanoImportPlayground.vue';
import NanoVersionBanner from './components/NanoVersionBanner.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('NanoContractPipeline', NanoContractPipeline);
    app.component('NanoImportPlayground', NanoImportPlayground);
    app.component('NanoVersionBanner', NanoVersionBanner);
  },
} satisfies Theme;
