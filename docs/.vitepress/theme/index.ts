import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { h } from 'vue';
import NanoContractPipeline from './components/NanoContractPipeline.vue';
import NanoImportPlayground from './components/NanoImportPlayground.vue';
import OrvaCodeLanguageToggle from './components/OrvaCodeLanguageToggle.vue';
import OrvaMiddlewareMap from './components/OrvaMiddlewareMap.vue';
import './custom.css';

const codeLanguagePreferenceKey = 'orva-docs-code-language';

function readPreferredCodeLanguage() {
  if (typeof window === 'undefined') {
    return 'ts';
  }

  return window.localStorage.getItem(codeLanguagePreferenceKey) === 'js' ? 'js' : 'ts';
}

function applyCodeLanguage(root: ParentNode = document, language = readPreferredCodeLanguage()) {
  const controls = root.querySelectorAll<HTMLElement>('[data-code-language-option]');
  const switches = root.querySelectorAll<HTMLElement>('[data-code-switch]');

  controls.forEach((control) => {
    const active = control.dataset.codeLanguageOption === language;
    control.classList.toggle('is-active', active);
    control.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  switches.forEach((element) => {
    const panels = element.querySelectorAll<HTMLElement>('[data-code-switch-panel]');

    panels.forEach((panel) => {
      const active = panel.dataset.codeSwitchPanel === language;
      panel.classList.toggle('is-active', active);
      panel.toggleAttribute('hidden', !active);
    });
  });
}

function installCodeLanguageSwitches() {
  if (typeof document === 'undefined' || document.body.dataset.orvaCodeSwitchBound === 'true') {
    return;
  }

  document.body.dataset.orvaCodeSwitchBound = 'true';

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const option = target.closest<HTMLElement>('[data-code-language-option]');

    if (!option) {
      return;
    }

    const language = option.dataset.codeLanguageOption === 'js' ? 'js' : 'ts';
    window.localStorage.setItem(codeLanguagePreferenceKey, language);
    applyCodeLanguage(document, language);
  }, true);

  applyCodeLanguage(document);
}

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'sidebar-nav-before': () => h(OrvaCodeLanguageToggle),
  }),
  enhanceApp({ app, router }) {
    app.component('OrvaContractPipeline', NanoContractPipeline);
    app.component('OrvaImportPlayground', NanoImportPlayground);
    app.component('OrvaCodeLanguageToggle', OrvaCodeLanguageToggle);
    app.component('OrvaMiddlewareMap', OrvaMiddlewareMap);
    app.component('NanoContractPipeline', NanoContractPipeline);
    app.component('NanoImportPlayground', NanoImportPlayground);

    if (typeof window !== 'undefined') {
      installCodeLanguageSwitches();
      router.onAfterRouteChange = ((originalHandler) => (to) => {
        originalHandler?.(to);
        window.requestAnimationFrame(() => applyCodeLanguage(document));
      })(router.onAfterRouteChange);
    }
  },
} satisfies Theme;
