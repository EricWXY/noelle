import type { Plugin } from 'vue';

export const errorHandler: Plugin = function (app) {
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err, instance, info);
  }
}

export default errorHandler;
