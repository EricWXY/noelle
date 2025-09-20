import '@renderer/index.css';
import 'vfonts/Lato.css';

import i18n from '@renderer/i18n'
import Dialog from './index.vue';
import TitleBar from '@renderer/components/TitleBar.vue';
import DragRegion from '@renderer/components/DragRegion.vue';

createApp(Dialog).use(i18n).component('TitleBar', TitleBar).component('DragRegion', DragRegion).mount('#app');
