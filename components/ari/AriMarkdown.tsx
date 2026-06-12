'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AriMarkdown({
  content,
  isDark = true,
}: {
  content: string
  isDark?: boolean
}) {
  return (
    <div
      className={`ari-markdown text-sm leading-relaxed space-y-2 [&_p]:m-0 [&_p+p]:mt-2 [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-sm [&_h2]:mt-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1.5 [&_li]:my-0.5 [&_table]:w-full [&_table]:text-xs [&_th]:text-left [&_td]:py-0.5 [&_strong]:font-semibold ${
        isDark ? 'text-stone-200 [&_h2]:text-berry-200' : 'text-stone-700 [&_h2]:text-stone-900'
      }`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
