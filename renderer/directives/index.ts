import type { App } from 'vue'
import  installVRipple  from './ripple'

export default function (app: App) {
  app.use(installVRipple)
}

export * from './ripple'
