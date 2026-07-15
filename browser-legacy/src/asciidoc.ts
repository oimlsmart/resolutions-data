import Asciidoctor from '@asciidoctor/core'
const asciidoctor = Asciidoctor()

// PDF-extracted bullet characters: PUA range (U+E000–U+F8FF) + common Unicode bullets
const BULLET_RE = /^[\ue000-\uf8ff•●▪▸▹‣⁃]\s*/
const SUB_BULLET_RE = /^o\s+/

function preprocess(text: string): string {
  if (!text) return ''
  
  const lines = text.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '.') {
      i++
      continue
    }

    if (BULLET_RE.test(trimmed)) {
      const content = trimmed.replace(BULLET_RE, '')
      if (result.length > 0 && result[result.length - 1].trim() !== '') result.push('')
      result.push('* ' + content)
      i++
      while (i < lines.length && lines[i].trim() !== '' && lines[i].trim() !== '.'
             && !BULLET_RE.test(lines[i].trim()) && !SUB_BULLET_RE.test(lines[i].trim())) {
        if (SUB_BULLET_RE.test(lines[i].trim())) break
        if (i + 1 < lines.length && BULLET_RE.test(lines[i + 1].trim())) {
          result.push(lines[i])
          i++
          continue
        }
        break
      }
      continue
    }

    if (SUB_BULLET_RE.test(trimmed) && trimmed.length < 80) {
      const content = trimmed.replace(SUB_BULLET_RE, '')
      result.push('** ' + content)
      i++
      continue
    }

    result.push(line)
    i++
  }

  return result.join('\n')
}

export function asciidocify(text: string): string {
  if (!text) return ''
  const preprocessed = preprocess(text)
  return String(asciidoctor.convert(preprocessed, {
    standalone: false,
    safe: 'safe',
    attributes: { showtitle: false }
  }))
}
