import { defineConfig } from 'vitepress';

const latestVersion = 'v3.x';
const snapshotVersion = 'v3.1';

const algoliaEnabled = Boolean(
  process.env.NANO_DOCSEARCH_APP_ID
  && process.env.NANO_DOCSEARCH_API_KEY
  && process.env.NANO_DOCSEARCH_INDEX_NAME
);

function createSearchConfig(locale: 'zh' | 'en') {
  if (algoliaEnabled) {
    return {
      provider: 'algolia' as const,
      options: {
        appId: process.env.NANO_DOCSEARCH_APP_ID!,
        apiKey: process.env.NANO_DOCSEARCH_API_KEY!,
        indexName: process.env.NANO_DOCSEARCH_INDEX_NAME!,
        locales: {
          zh: {
            placeholder: '搜索文档',
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索',
              },
              modal: {
                searchBox: {
                  resetButtonTitle: '清除查询条件',
                  resetButtonAriaLabel: '清除查询条件',
                  cancelButtonText: '取消',
                  cancelButtonAriaLabel: '取消',
                },
                startScreen: {
                  recentSearchesTitle: '最近搜索',
                  noRecentSearchesText: '没有最近搜索',
                  saveRecentSearchButtonTitle: '保存到最近搜索',
                  removeRecentSearchButtonTitle: '从最近搜索中移除',
                  favoriteSearchesTitle: '收藏',
                  removeFavoriteSearchButtonTitle: '从收藏中移除',
                },
                errorScreen: {
                  titleText: '无法获取结果',
                  helpText: '请检查网络连接',
                },
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                  searchByText: '搜索提供方',
                },
                noResultsScreen: {
                  noResultsText: '没有找到相关结果',
                  suggestedQueryText: '可以尝试搜索',
                  reportMissingResultsText: '你认为应该有结果？',
                  reportMissingResultsLinkText: '点击反馈',
                },
              },
            },
          },
          en: {
            placeholder: 'Search docs',
          },
        },
        ...(process.env.NANO_DOCSEARCH_ASSISTANT_ID
          ? {
              askAi: {
                assistantId: process.env.NANO_DOCSEARCH_ASSISTANT_ID,
              },
            }
          : {}),
      },
    };
  }

  return {
    provider: 'local' as const,
    options: locale === 'zh'
      ? {
          translations: {
            button: {
              buttonText: '搜索',
              buttonAriaLabel: '搜索',
            },
            modal: {
              noResultsText: '没有找到相关结果',
              resetButtonTitle: '清除查询条件',
              footer: {
                selectText: '选择',
                navigateText: '切换',
                closeText: '关闭',
              },
            },
          },
        }
      : {},
  };
}

function createVersionNav(base: '' | '/en') {
  return {
    text: latestVersion,
    items: [
      {
        text: base === '' ? '当前主线文档' : 'Current release docs',
        link: `${base}/guide/introduction`,
      },
      {
        text: `${snapshotVersion} Snapshot`,
        link: `${base}/v3/`,
      },
    ],
  };
}

function createZhSidebar(prefix = '') {
  return [
    {
      text: '开始',
      items: [
        { text: '介绍', link: `${prefix}/guide/introduction` },
        { text: '快速开始', link: `${prefix}/guide/quickstart` },
        { text: '路由与组合', link: `${prefix}/guide/routing` },
        { text: 'Context 与响应', link: `${prefix}/guide/context` },
        { text: '中间件与类型累积', link: `${prefix}/guide/production` },
      ],
    },
    {
      text: '核心能力',
      items: [
        { text: '中间件目录', link: `${prefix}/middlewares` },
        { text: 'Validator', link: `${prefix}/validator` },
        { text: 'RPC', link: `${prefix}/rpc` },
        { text: 'OpenAPI', link: `${prefix}/openapi` },
        { text: '适配器', link: `${prefix}/adapters` },
        { text: '导出与子模块', link: `${prefix}/exports` },
      ],
    },
  ];
}

function createEnSidebar(prefix = '/en') {
  return [
    {
      text: 'Get Started',
      items: [
        { text: 'Introduction', link: `${prefix}/guide/introduction` },
        { text: 'Quickstart', link: `${prefix}/guide/quickstart` },
        { text: 'Routing and Composition', link: `${prefix}/guide/routing` },
        { text: 'Context and Responses', link: `${prefix}/guide/context` },
        { text: 'Middleware and Type Accumulation', link: `${prefix}/guide/production` },
      ],
    },
    {
      text: 'Core Capabilities',
      items: [
        { text: 'Middleware Catalog', link: `${prefix}/middlewares` },
        { text: 'Validator', link: `${prefix}/validator` },
        { text: 'RPC', link: `${prefix}/rpc` },
        { text: 'OpenAPI', link: `${prefix}/openapi` },
        { text: 'Adapters', link: `${prefix}/adapters` },
        { text: 'Exports', link: `${prefix}/exports` },
      ],
    },
  ];
}

function createZhThemeConfig() {
  return {
    logo: '/logo.svg',
    siteTitle: 'nano',
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: '中间件', link: '/middlewares' },
      { text: '验证', link: '/validator' },
      { text: 'RPC', link: '/rpc' },
      { text: 'OpenAPI', link: '/openapi' },
      { text: '适配器', link: '/adapters' },
      { text: '导出', link: '/exports' },
      createVersionNav(''),
    ],
    sidebar: {
      '/v3/': createZhSidebar('/v3'),
      '/': createZhSidebar(''),
    },
    search: createSearchConfig('zh'),
    outline: {
      level: [2, 3],
      label: '本页目录',
    },
    footer: {
      message: 'Built with VitePress. Structured for production docs, multilingual delivery and long-term versioning.',
      copyright: 'MIT Licensed',
    },
  };
}

function createEnThemeConfig() {
  return {
    logo: '/logo.svg',
    siteTitle: 'nano',
    nav: [
      { text: 'Guide', link: '/en/guide/introduction' },
      { text: 'Middleware', link: '/en/middlewares' },
      { text: 'Validator', link: '/en/validator' },
      { text: 'RPC', link: '/en/rpc' },
      { text: 'OpenAPI', link: '/en/openapi' },
      { text: 'Adapters', link: '/en/adapters' },
      { text: 'Exports', link: '/en/exports' },
      createVersionNav('/en'),
    ],
    sidebar: {
      '/en/v3/': createEnSidebar('/en/v3'),
      '/en/': createEnSidebar('/en'),
    },
    search: createSearchConfig('en'),
    outline: {
      level: [2, 3],
      label: 'On this page',
    },
    footer: {
      message: 'Built with VitePress. Structured for production docs, multilingual delivery and long-term versioning.',
      copyright: 'MIT Licensed',
    },
  };
}

export default defineConfig({
  title: 'nano',
  description: '面向 Fetch API 的轻量 TypeScript Web 框架，提供 typed middleware、validator、RPC、OpenAPI 与多运行时适配。',
  cleanUrls: true,
  lastUpdated: true,
  appearance: true,
  markdown: {
    container: {
      tipLabel: '提示',
      warningLabel: '注意',
      dangerLabel: '警告',
      infoLabel: '信息',
      detailsLabel: '详情',
    },
  },
  head: [
    ['meta', { name: 'theme-color', content: '#0f766e' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'nano' }],
    ['meta', { property: 'og:description', content: '轻量、typed、可组合的 Fetch API Web 框架。' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'mask-icon', href: '/favicon.svg', color: '#0f766e' }],
  ],
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'nano',
      description: '面向 Fetch API 的轻量 TypeScript Web 框架，提供 typed middleware、validator、RPC、OpenAPI 与多运行时适配。',
      themeConfig: createZhThemeConfig(),
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'nano',
      description: 'A lightweight Fetch API web framework with typed middleware, validator, RPC, OpenAPI and multi-runtime adapters.',
      themeConfig: createEnThemeConfig(),
    },
  },
});
