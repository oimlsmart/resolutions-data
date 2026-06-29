import { ref, type Ref } from 'vue'

/**
 * Clipboard copy with a transient "copied" flag for UI feedback.
 *
 * Usage:
 *   const { copied, copy } = useClipboard()
 *   <button @click="copy(urn)" :aria-label="copied ? 'Copied' : 'Copy'">
 */
export function useClipboard(timeoutMs = 2000): {
  copied: Ref<boolean>
  copy: (text: string) => void
} {
  const copied = ref(false)

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, timeoutMs)
    })
  }

  return { copied, copy }
}
