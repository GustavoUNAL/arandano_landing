'use client'

import AriMarkdown from '@/components/ari/AriMarkdown'
import AriTypewriter from '@/components/ari/AriTypewriter'
import AriTypingIndicator from '@/components/ari/AriTypingIndicator'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  animate?: boolean
}

const MOBILE_CHROME = 148

export default function AriPredictorPanel({
  isDark = true,
  matchId,
  initialMessage,
}: {
  isDark?: boolean
  matchId?: number
  initialMessage?: string
}) {
  const theme = mundialTheme(isDark)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [welcomeLoading, setWelcomeLoading] = useState(true)
  const [welcome, setWelcome] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState('')
  const [panelHeight, setPanelHeight] = useState<number | null>(null)
  const [typingDone, setTypingDone] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sentInitial = useRef(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      if (window.innerWidth >= 1024) {
        setPanelHeight(null)
        return
      }
      setPanelHeight(Math.max(300, vv.height - MOBILE_CHROME))
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    window.addEventListener('orientationchange', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
  }, [])

  const loadWelcome = useCallback(async () => {
    setWelcomeLoading(true)
    try {
      const res = await fetch('/api/ari/welcome')
      const json = await res.json()
      if (res.ok) {
        if (json.content) setWelcome(json.content)
        if (Array.isArray(json.suggestions)) setSuggestions(json.suggestions)
      }
    } catch {
      /* opcional */
    } finally {
      setWelcomeLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWelcome()
  }, [loadWelcome])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading || !typingDone) return
      setError('')
      setLoading(true)
      setTypingDone(false)
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
      setInput('')
      scrollToBottom()

      try {
        const res = await fetch('/api/ari/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, threadId, matchId }),
        })
        const json = await res.json()
        if (!res.ok) {
          if (json.unavailable && json.content) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: String(json.content), animate: true },
            ])
            setTypingDone(false)
            return
          }
          throw new Error(json.error || 'Error al consultar a Predictor')
        }
        if (json.threadId) setThreadId(json.threadId)
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: json.content, animate: true },
        ])
      } catch (e) {
        const fallback =
          'Uy, algo falló y no pude responder. Intenta de nuevo en un momento. ⚽'
        setMessages((prev) => [...prev, { role: 'assistant', content: fallback, animate: true }])
        console.error('[predictor]', e)
        setTypingDone(false)
      } finally {
        setLoading(false)
      }
    },
    [loading, threadId, matchId, scrollToBottom, typingDone]
  )

  useEffect(() => {
    if (initialMessage && !sentInitial.current) {
      sentInitial.current = true
      void sendMessage(initialMessage)
    }
  }, [initialMessage, sendMessage])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, welcome, scrollToBottom])

  const showSuggestions = messages.length === 0 && suggestions.length > 0 && !loading && typingDone

  return (
    <div
      className="flex flex-col min-h-0 lg:max-h-[min(72vh,42rem)]"
      style={panelHeight ? { height: panelHeight } : undefined}
    >
      <div className="shrink-0 flex items-center gap-2.5 mb-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${
            isDark ? 'bg-berry-600/25 ring-1 ring-berry-500/30' : 'bg-berry-100 ring-1 ring-berry-200'
          }`}
        >
          ⚽
        </div>
        <div>
          <h2 className={`font-display font-bold text-sm ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Predictor
          </h2>
          <p className={`text-[11px] ${theme.muted}`}>Tu compañero para la polla del Mundial</p>
        </div>
      </div>

      <div
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-2xl border px-3 py-3 space-y-3 ${theme.card}`}
      >
        {welcomeLoading && messages.length === 0 && (
          <div className="flex justify-start">
            <Bubble isDark={isDark} isUser={false}>
              <AriTypingIndicator isDark={isDark} />
            </Bubble>
          </div>
        )}

        {!welcomeLoading && welcome && messages.length === 0 && (
          <div className="flex justify-start">
            <Bubble isDark={isDark} isUser={false}>
              <AriMarkdown content={welcome} isDark={isDark} />
            </Bubble>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Bubble isDark={isDark} isUser={m.role === 'user'}>
              {m.role === 'assistant' ? (
                m.animate ? (
                  <AriTypewriter
                    content={m.content}
                    isDark={isDark}
                    onComplete={() => {
                      setTypingDone(true)
                      scrollToBottom()
                    }}
                  />
                ) : (
                  <AriMarkdown content={m.content} isDark={isDark} />
                )
              ) : (
                <p className="text-sm leading-relaxed">{m.content}</p>
              )}
            </Bubble>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <Bubble isDark={isDark} isUser={false}>
              <AriTypingIndicator isDark={isDark} />
            </Bubble>
          </div>
        )}
        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <div className="shrink-0 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {showSuggestions && (
          <div className="mb-2.5">
            <p className={`text-[10px] uppercase tracking-wide mb-1.5 ${theme.muted}`}>Puedes preguntarme</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void sendMessage(s)}
                  disabled={loading || !typingDone}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${
                    isDark
                      ? 'border-berry-500/25 text-stone-300 hover:bg-berry-600/15'
                      : 'border-berry-200 text-stone-600 bg-white hover:bg-berry-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void sendMessage(input)
          }}
          className={`flex items-center gap-2 rounded-2xl border px-2 py-1.5 ${
            isDark ? 'border-white/10 bg-stone-900/50' : 'border-stone-200 bg-white shadow-sm'
          }`}
        >
          <input
            type="text"
            enterKeyHint="send"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={scrollToBottom}
            placeholder="Escribe tu pregunta…"
            disabled={loading || !typingDone}
            maxLength={300}
            className={`min-w-0 flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none disabled:opacity-50 ${
              isDark ? 'text-white placeholder:text-stone-500' : 'text-stone-800 placeholder:text-stone-400'
            }`}
          />
          <button
            type="submit"
            disabled={loading || !typingDone || !input.trim()}
            className="shrink-0 rounded-xl bg-berry-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}

function Bubble({
  children,
  isDark,
  isUser,
}: {
  children: ReactNode
  isDark: boolean
  isUser: boolean
}) {
  return (
    <div
      className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 ${
        isUser
          ? 'rounded-tr-sm bg-berry-600 text-white'
          : isDark
            ? 'rounded-tl-sm bg-white/5 border border-white/8'
            : 'rounded-tl-sm bg-stone-50 border border-stone-200/70'
      }`}
    >
      {children}
    </div>
  )
}
