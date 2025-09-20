import type { Directive, App } from 'vue'

export const vRipple: Directive = {
  mounted(el: HTMLElement) {
    el.style.position = 'relative'
    el.style.overflow = 'hidden'

    el.addEventListener('click', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const diameter = Math.max(el.clientWidth, el.clientHeight)
      const radius = diameter / 2

      const ripple = document.createElement('div')
      ripple.style.position = 'absolute'
      ripple.style.width = `${diameter}px`
      ripple.style.height = `${diameter}px`
      ripple.style.borderRadius = '50%'
      ripple.style.transform = 'scale(0)'

      ripple.style.backgroundColor = 'var(--ripple-color)'
      ripple.style.opacity = 'var(--ripple-opacity)'
      ripple.style.pointerEvents = 'none'
      ripple.style.transition = 'transform 0.6s, opacity 0.6s'

      // 计算点击位置
      ripple.style.left = `${e.clientX - rect.left - radius}px`
      ripple.style.top = `${e.clientY - rect.top - radius}px`

      el.appendChild(ripple)

      // 触发动画
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(2)'
        ripple.style.opacity = '0'
      })

      // 动画结束后移除元素
      setTimeout(() => ripple.remove(), 600)
    })
  }
}

export default function (app: App) {
  app.directive('Ripple', vRipple)
}
