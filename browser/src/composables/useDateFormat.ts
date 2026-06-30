// Date-formatting composable that always uses the current UI language.
// View code calls `const { formatDate, formatDateShort, formatDateRange } = useDateFormat()`
// instead of importing the underlying helpers and threading `lang` everywhere.

import { useI18n } from './useI18n'
import {
  formatDate as _formatDate,
  formatDateShort as _formatDateShort,
  formatDateRange as _formatDateRange,
  formatMonthYear as _formatMonthYear,
} from '../utils/format'

export function useDateFormat() {
  const { lang } = useI18n()
  return {
    formatDate:        (d: string) => _formatDate(d, lang.value),
    formatDateShort:   (d: string) => _formatDateShort(d, lang.value),
    formatMonthYear:   (d: string) => _formatMonthYear(d, lang.value),
    formatDateRange:   (a: string, b?: string | null) => _formatDateRange(a, b, lang.value),
  }
}
