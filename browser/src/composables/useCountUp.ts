import { ref, watch, type Ref, onUnmounted } from 'vue'

export function useCountUp(target: Ref<number> | number, isReady: Ref<boolean>, duration: number = 1500) {
  const current = ref(0)
  let startTime: number | null = null
  let animationFrame: number | null = null

  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp
    const progress = timestamp - startTime
    
    // Percentage of completion
    const percent = Math.min(progress / duration, 1)
    
    // Apply easing
    const eased = easeOutCubic(percent)
    
    // Calculate current value
    const finalTarget = typeof target === 'number' ? target : target.value
    current.value = Math.floor(eased * finalTarget)
    
    if (percent < 1) {
      animationFrame = requestAnimationFrame(animate)
    } else {
      current.value = finalTarget
    }
  }

  const startAnimation = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame)
    startTime = null
    animationFrame = requestAnimationFrame(animate)
  }

  watch(isReady, (ready) => {
    if (ready) {
      startAnimation()
    }
  }, { immediate: true })

  onUnmounted(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame)
  })

  return current
}
