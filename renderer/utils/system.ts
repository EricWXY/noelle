
export function isMac() {
  return window.api.isMac();
}

export function openWindow(name: WindowNames) {
  window.api.openWindow(name);
}
