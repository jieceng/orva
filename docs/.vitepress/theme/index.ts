import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import NanoContractPipeline from './components/NanoContractPipeline.vue';
import NanoImportPlayground from './components/NanoImportPlayground.vue';
import OrvaMiddlewareMap from './components/OrvaMiddlewareMap.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('OrvaContractPipeline', NanoContractPipeline);
    app.component('OrvaImportPlayground', NanoImportPlayground);
    app.component('OrvaMiddlewareMap', OrvaMiddlewareMap);
    app.component('NanoContractPipeline', NanoContractPipeline);
    app.component('NanoImportPlayground', NanoImportPlayground);
  },
} satisfies Theme;
