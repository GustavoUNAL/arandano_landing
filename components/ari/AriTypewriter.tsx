'use client'

import AriMarkdown from '@/components/ari/AriMarkdown'
import { useEffect, useRef, useState } from 'react'

const MAX_TYPEWRITER_CHARS = 220
const MS_PER_CHAR = 10

export default function AriTypewriter({
  content,
  isDark = true,
  onComplete,
}: {
  content: string
  isDark?: boolean
  onComplete?: () => void
}) {
  const [visible, setVisible] = useState('')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (content.length > MAX_TYPEWRITER_CHARS) {
      setVisible(content)
      onCompleteRef.current?.()
      return
    }

    setVisible('')
    let i = 0
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      i += 1
      setVisible(content.slice(0, i))
      if (i < content.length) {
        timer = setTimeout(tick, MS_PER_CHAR)
      } else {
        onCompleteRef.current?.()
      }
    }

    timer = setTimeout(tick, MS_PER_CHAR)
    return () => clearTimeout(timer)
  }, [content])

  return <AriMarkdown content={visible || ' '} isDark={isDark} />
}
