'use client'

import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { AfTopScorer } from '@/lib/api-football-client'
import { useEffect, useState } from 'react'

type Tab = 'scorers' | 'assists' | 'yellows'

interface TournamentStats {
  topScorers: AfTopScorer[]
  topAssists: AfTopScorer[]
  topYellowCards: AfTopScorer[]
  updatedAt: string
}

export default function TopScorersPanel({ isDark = true }: { isDark?: boolean }) {
  const theme = mundialTheme(isDark)
  const [data, setData] = useState<TournamentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('scorers')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    if (data) return
    setLoading(true)
    fetch('/api/sports/topscorers')
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error)
        setData(j)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [open, data])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'scorers', label: '⚽ Goleadores' },
    { id: 'assists', label: '🎯 Asistencias' },
    { id: 'yellows', label: '🟨 Amarillas' },
  ]

  const list: AfTopScorer[] =
    tab === 'scorers' ? (data?.topScorers ?? []) :
    tab === 'assists' ? (data?.topAssists ?? []) :
    (data?.topYellowCards ?? [])

  const getMainStat = (p: AfTopScorer) => {
    const s = p.statistics[0]
    if (tab === 'scorers') return { value: s?.goals.total ?? 0, label: 'goles' }
    if (tab === 'assists') return { value: s?.goals.assists ?? 0, label: 'asistencias' }
    return { value: s?.cards.yellow ?? 0, label: 'amarillas' }
  }

  return (
    <section className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-stone-950/60' : 'border-stone-200 bg-white'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-3 flex items-center justify-between gap-2 border-b text-left ${isDark ? 'border-white/10' : 'border-stone-100'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🏅</span>
          <div>
            <p className="font-semibold text-sm">Estadísticas del Torneo</p>
            <p className={`text-[10px] ${theme.mutedSm}`}>Goleadores · Asistencias · Tarjetas</p>
          </div>
        </div>
        <span className={`text-sm ${theme.mutedSm}`}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {/* Tabs */}
          <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-stone-900/60' : 'bg-stone-100'}`}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  tab === t.id
                    ? isDark ? 'bg-berry-600 text-white' : 'bg-white text-berry-700 shadow-sm'
                    : theme.mutedSm
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-3 border-berry-400/30 border-t-berry-400 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <p className={`text-xs text-center py-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </p>
          )}

          {!loading && !error && list.length === 0 && (
            <p className={`text-xs text-center py-4 ${theme.mutedSm}`}>
              Sin datos disponibles aún
            </p>
          )}

          {!loading && list.length > 0 && (
            <div className="space-y-2">
              {list.slice(0, 10).map((p, i) => {
                const s = p.statistics[0]
                const stat = getMainStat(p)
                return (
                  <div
                    key={p.player.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                      i === 0
                        ? isDark ? 'bg-amber-900/25 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
                        : isDark ? 'bg-white/3 border border-white/5' : 'bg-stone-50 border border-stone-100'
                    }`}
                  >
                    <span className={`w-5 shrink-0 text-center font-bold text-xs ${
                      i === 0 ? (isDark ? 'text-amber-300' : 'text-amber-600') :
                      i === 1 ? (isDark ? 'text-stone-300' : 'text-stone-500') :
                      i === 2 ? (isDark ? 'text-orange-400' : 'text-orange-600') :
                      theme.mutedSm
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <img
                      src={p.player.photo}
                      alt={p.player.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 bg-stone-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-xs">{p.player.name}</p>
                      <div className="flex items-center gap-1.5">
                        {s?.team.logo && (
                          <img src={s.team.logo} alt={s?.team.name} className="w-3.5 h-3.5 object-contain" />
                        )}
                        <p className={`text-[10px] truncate ${theme.mutedSm}`}>{s?.team.name}</p>
                        {s?.games.appearences && (
                          <p className={`text-[10px] ${theme.mutedSm}`}>· {s.games.appearences} partidos</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-base tabular-nums ${isDark ? 'text-berry-300' : 'text-berry-700'}`}>
                        {stat.value}
                      </p>
                      <p className={`text-[9px] ${theme.mutedSm}`}>{stat.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {data?.updatedAt && (
            <p className={`text-[9px] text-right ${theme.mutedSm}`}>
              Act. {new Date(data.updatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
