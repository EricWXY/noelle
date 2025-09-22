import '@renderer/index.css';
import 'vfonts/Lato.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia'
import errorHandler from '@renderer/utils/vueErrorHandler';
import i18n from '@renderer/i18n'
import Setting from './index.vue';
import TitleBar from '@renderer/components/TitleBar.vue';
import DragRegion from '@renderer/components/DragRegion.vue';



createApp(Setting)
  .use(i18n)
  .use(createPinia())
  .use(errorHandler)
  .component('TitleBar', TitleBar)
  .component('DragRegion', DragRegion)
  .mount('#app');
