import './index.css';
import 'vfonts/Lato.css';
import 'highlight.js/styles/lioshi.css';

import { type Plugin } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia } from 'pinia';
import { preloadIcons } from './utils/icons';
import errorHandler from './utils/vueErrorHandler';
import i18n from './i18n';
import TitleBar from './components/TitleBar.vue';
import DragRegion from './components/DragRegion.vue';
import directives from './directives';
import App from './App.vue';

const components: Plugin = function (app) {
  app.component('TitleBar', TitleBar)
  app.component('DragRegion', DragRegion)
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./views/index.vue'),
      children: [
        {
          path: '/',
          redirect: 'conversation'
        },
        {
          name: 'conversation',
          path: 'conversation/:id?',
          component: () => import('./views/conversation.vue')
        }
      ]
    }
  ]
});

preloadIcons().finally(() =>
  createApp(App)
    .use(createPinia())
    .use(directives)
    .use(components)
    .use(router)
    .use(i18n)
    .use(errorHandler)
    .mount('#app')
)

