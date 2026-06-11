'use client'

import { IconPremium, IconShield } from '@/components/sports/SportsIcons'
import UserAvatar from '@/components/sports/UserAvatar'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { AdminSportsUserRow } from '@/lib/sports-polla-shared'
import { useCallback, useEffect, useState } from 'react'

interface AdminUsersResponse {
  users: AdminSportsUserRow[]
  stats: { total: number; withPassport: number; withoutPassport: number }
}

interface PollaAdminPanelProps {
  isDark?: boolean
}

export default function PollaAdminPanel({ isDark = true }: PollaAdminPanelProps) {
  const theme = mundialTheme(isDark)
  const [data, setData] = useState<AdminUsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'passport' | 'no-passport'>('all')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sports/admin/users')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar usuarios')
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const togglePassport = async (user: AdminSportsUserRow) => {
    setSavingId(user.id)
    try {
      const res = await fetch('/api/sports/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, hasPassport: !user.hasPassport }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo actualizar')
      setData((prev) => {
        if (!prev) return prev
        const users = prev.users.map((u) =>
          u.id === user.id ? { ...u, hasPassport: json.user.hasPassport } : u
        )
        const withPassport = users.filter((u) => u.hasPassport).length
        return {
          users,
          stats: {
            total: users.length,
            withPassport,
            withoutPassport: users.length - withPassport,
          },
        }
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSavingId(null)
    }
  }

  const filtered =
    data?.users.filter((u) => {
      if (filter === 'passport') return u.hasPassport
      if (filter === 'no-passport') return !u.hasPassport
      return true
    }) ?? []

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-berry-400/30 border-t-berry-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button type="button" onClick={loadUsers} className={`font-semibold ${theme.accentLink}`}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div
        className={`rounded-2xl border p-5 lg:p-6 ${
          isDark
            ? 'border-amber-500/20 bg-gradient-to-r from-amber-950/30 to-stone-950'
            : 'border-amber-200 bg-gradient-to-r from-amber-50 to-white shadow-sm'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <IconShield className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`font-display text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Panel de administración
            </h2>
            <p className={`text-sm mt-1 ${theme.muted}`}>
              Asigna el pasaporte a quienes lo compraron. Solo ellos pueden figurar en el podio de ganadores.
            </p>
          </div>
        </div>
        {data && (
          <div className="mt-4 grid grid-cols-3 gap-2 lg:gap-3 max-w-lg">
            {[
              { label: 'Registrados', value: data.stats.total },
              { label: 'Con pasaporte', value: data.stats.withPassport },
              { label: 'Sin pasaporte', value: data.stats.withoutPassport },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-xl px-3 py-2.5 text-center ${
                  isDark ? 'bg-black/25 border border-white/10' : 'bg-white border border-stone-200'
                }`}
              >
                <p className={`text-[10px] uppercase tracking-wide ${theme.mutedSm}`}>{s.label}</p>
                <p className={`text-lg font-bold tabular-nums ${theme.accent}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all', label: 'Todos' },
            { id: 'passport', label: 'Con pasaporte' },
            { id: 'no-passport', label: 'Sin pasaporte' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f.id
                ? 'bg-berry-600 text-white'
                : isDark
                  ? 'bg-white/5 text-stone-400'
                  : 'bg-stone-100 text-stone-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className={`text-center py-10 text-sm ${theme.muted}`}>No hay usuarios en este filtro</p>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              className={`rounded-2xl border p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                user.hasPassport
                  ? isDark
                    ? 'border-amber-500/30 bg-stone-900/80'
                    : 'border-amber-200 bg-white shadow-sm'
                  : isDark
                    ? 'border-white/5 bg-stone-900/40 opacity-55'
                    : 'border-stone-200 bg-stone-50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <UserAvatar
                  src={user.image}
                  name={user.name}
                  size={48}
                  className={`shrink-0 ${user.hasPassport ? '' : 'grayscale'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`font-semibold truncate ${
                        user.hasPassport ? theme.sidebarUserName : theme.muted
                      }`}
                    >
                      {user.displayAlias ?? user.name ?? 'Sin nombre'}
                    </p>
                    {user.hasPassport && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          isDark
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <IconPremium className="w-3 h-3" />
                        Pasaporte
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${theme.mutedSm}`}>{user.email}</p>
                  <p className={`text-[10px] mt-1 ${theme.mutedSm}`}>
                    {user.picksCount} picks · {user.settledCount} calificados ·{' '}
                    <span className={theme.accent}>{user.totalPoints} pts</span> ·{' '}
                    {user.credits.toLocaleString('es-CO')} créditos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => togglePassport(user)}
                disabled={savingId === user.id}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  user.hasPassport
                    ? isDark
                      ? 'border border-white/15 text-stone-300 hover:bg-white/5'
                      : 'border border-stone-300 text-stone-600 hover:bg-stone-100'
                    : 'bg-berry-600 hover:bg-berry-500 text-white'
                }`}
              >
                {savingId === user.id
                  ? 'Guardando…'
                  : user.hasPassport
                    ? 'Quitar pasaporte'
                    : 'Asignar pasaporte'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
