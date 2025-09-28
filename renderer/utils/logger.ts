export const logger = window.api.logger ?? console;

if (window.api.logger) {
  console.log = logger.info;
  console.info = logger.info;
  console.warn = logger.warn;
  console.error = logger.error;
  console.debug = logger.debug;
}
