'use client'

import { IconPremium, IconShield } from '@/components/sports/SportsIcons'
import UserAvatar from '@/components/sports/UserAvatar'
import {
  KNOCKOUT_PASSPORT_LABEL,
  KNOCKOUT_PASSPORT_PRICE_LABEL,
  PRIZE_CLAIM_RULES,
} from '@/lib/polla-rules'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { PassportRequestWithUser } from '@/lib/passport-requests'
import type { AdminSportsUserRow } from '@/lib/sports-polla-shared'
import { useCallback, useEffect, useState } from 'react'

interface AdminUsersResponse {
  users: AdminSportsUserRow[]
  stats: {
    total: number
    withPassport: number
    withoutPassport: number
    withKnockoutPassport: number
    withoutKnockoutPassport: number
  }
}

interface PollaAdminPanelProps {
  isDark?: boolean
}

type AdminView = 'requests' | 'users' | 'whatsapp'

export default function PollaAdminPanel({ isDark = true }: PollaAdminPanelProps) {
  const theme = mundialTheme(isDark)
  const [view, setView] = useState<AdminView>('requests')
  const [data, setData] = useState<AdminUsersResponse | null>(null)
  const [requests, setRequests] = useState<PassportRequestWithUser[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'knockout-passport' | 'no-passport'>('all')
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, reqRes] = await Promise.all([
        fetch('/api/sports/admin/users'),
        fetch('/api/sports/admin/passport-requests'),
      ])
      const usersJson = await usersRes.json()
      const reqJson = await reqRes.json()
      if (!usersRes.ok) throw new Error(usersJson.error || 'No se pudo cargar usuarios')
      if (!reqRes.ok) throw new Error(reqJson.error || 'No se pudo cargar solicitudes')
      setData(usersJson)
      setRequests(reqJson.requests ?? [])
      setPendingCount(reqJson.pendingCount ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const recomputeStats = (users: AdminSportsUserRow[]) => {
    const withPassport = users.filter((u) => u.hasPassport).length
    const withKnockoutPassport = users.filter((u) => u.hasKnockoutPassport).length
    return {
      total: users.length,
      withPassport,
      withoutPassport: users.length - withPassport,
      withKnockoutPassport,
      withoutKnockoutPassport: users.length - withKnockoutPassport,
    }
  }

  const reviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setSavingId(requestId)
    setError('')
    try {
      const res = await fetch('/api/sports/admin/passport-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          adminNote: rejectNote[requestId]?.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo actualizar')

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, ...json.request } : r))
      )
      setPendingCount((c) => Math.max(0, c - (action === 'approve' || action === 'reject' ? 1 : 0)))

      if (action === 'approve' && data) {
        const userId = json.request.userId
        const users = data.users.map((u) =>
          u.id === userId ? { ...u, hasKnockoutPassport: true } : u
        )
        setData({ users, stats: recomputeStats(users) })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSavingId(null)
    }
  }

  const toggleKnockoutPassport = async (user: AdminSportsUserRow) => {
    const saveKey = `${user.id}-knockout`
    setSavingId(saveKey)
    try {
      const res = await fetch('/api/sports/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          hasKnockoutPassport: !user.hasKnockoutPassport,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo actualizar')
      setData((prev) => {
        if (!prev) return prev
        const users = prev.users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                hasPassport: json.user.hasPassport,
                hasKnockoutPassport: json.user.hasKnockoutPassport,
              }
            : u
        )
        return { users, stats: recomputeStats(users) }
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSavingId(null)
    }
  }

  const filtered =
    data?.users.filter((u) => {
      if (filter === 'knockout-passport') return u.hasKnockoutPassport
      if (filter === 'no-passport') return !u.hasKnockoutPassport
      return true
    }) ?? []

  const pendingRequests = requests.filter((r) => r.status === 'pending')

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
        <button type="button" onClick={loadAll} className={`font-semibold ${theme.accentLink}`}>
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
              Aprueba solicitudes del {KNOCKOUT_PASSPORT_LABEL} ({KNOCKOUT_PASSPORT_PRICE_LABEL}) tras verificar el
              pago en el café.
            </p>
          </div>
        </div>
        {data && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
            {[
              { label: 'Registrados', value: data.stats.total },
              { label: 'Solicitudes pendientes', value: pendingCount },
              { label: 'Con pasaporte', value: data.stats.withKnockoutPassport },
              { label: 'Sin pasaporte', value: data.stats.withoutKnockoutPassport },
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
            { id: 'requests' as const, label: `Solicitudes${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { id: 'users' as const, label: 'Jugadores' },
            { id: 'whatsapp' as const, label: '📱 WhatsApp' },
          ] as const
        ).map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === v.id
                ? 'bg-berry-600 text-white'
                : isDark
                  ? 'bg-white/5 text-stone-400'
                  : 'bg-stone-100 text-stone-600'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      {view === 'requests' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <p className={`text-center py-10 text-sm ${theme.muted}`}>No hay solicitudes pendientes</p>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className={`rounded-2xl border p-4 lg:p-5 space-y-3 ${
                  isDark ? 'border-berry-500/25 bg-stone-900/60' : 'border-berry-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserAvatar src={req.image} name={req.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{req.displayAlias ?? req.name ?? 'Sin nombre'}</p>
                    <p className={`text-xs truncate ${theme.mutedSm}`}>{req.email}</p>
                    <p className={`text-[10px] mt-1 ${theme.mutedSm}`}>
                      {new Date(req.createdAt).toLocaleString('es-CO')} · {req.priceCop.toLocaleString('es-CO')} COP
                    </p>
                  </div>
                </div>
                {req.userNote && (
                  <p className={`text-xs rounded-lg px-3 py-2 ${isDark ? 'bg-black/30' : 'bg-stone-50'}`}>
                    <span className={theme.mutedSm}>Nota del jugador: </span>
                    {req.userNote}
                  </p>
                )}
                {req.receiptPath && (
                  <a
                    href={`/api/sports/admin/passport-requests/${req.id}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex text-xs font-semibold underline ${theme.accentLink}`}
                  >
                    Ver comprobante de pago →
                  </a>
                )}
                <input
                  type="text"
                  value={rejectNote[req.id] ?? ''}
                  onChange={(e) => setRejectNote((prev) => ({ ...prev, [req.id]: e.target.value }))}
                  placeholder="Nota al rechazar (opcional)"
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${theme.profileHeroInput}`}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => reviewRequest(req.id, 'approve')}
                    disabled={savingId === req.id}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {savingId === req.id ? '…' : 'Aprobar y activar pasaporte'}
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewRequest(req.id, 'reject')}
                    disabled={savingId === req.id}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 ${
                      isDark
                        ? 'border border-red-500/40 text-red-300 hover:bg-red-950/30'
                        : 'border border-red-300 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          )}

          {requests.filter((r) => r.status !== 'pending').length > 0 && (
            <details className={`text-xs ${theme.muted}`}>
              <summary className="cursor-pointer font-medium py-2">Historial de solicitudes</summary>
              <div className="space-y-2 mt-2">
                {requests
                  .filter((r) => r.status !== 'pending')
                  .slice(0, 20)
                  .map((r) => (
                    <div
                      key={r.id}
                      className={`flex justify-between gap-2 rounded-lg px-3 py-2 ${
                        isDark ? 'bg-white/5' : 'bg-stone-50'
                      }`}
                    >
                      <span className="truncate">{r.displayAlias ?? r.email}</span>
                      <span
                        className={
                          r.status === 'approved'
                            ? 'text-emerald-400 shrink-0'
                            : 'text-red-400 shrink-0'
                        }
                      >
                        {r.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>
      )}

      {view === 'users' && (
        <>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'knockout-passport', label: 'Con pasaporte' },
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

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className={`text-center py-10 text-sm ${theme.muted}`}>No hay usuarios en este filtro</p>
            ) : (
              filtered.map((user) => (
                <div
                  key={user.id}
                  className={`rounded-2xl border p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center gap-4 transition-all ${
                    user.hasKnockoutPassport
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
                      className={`shrink-0 ${user.hasKnockoutPassport ? '' : 'grayscale'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`font-semibold truncate ${
                            user.hasKnockoutPassport ? theme.sidebarUserName : theme.muted
                          }`}
                        >
                          {user.displayAlias ?? user.name ?? 'Sin nombre'}
                        </p>
                        {user.hasKnockoutPassport && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              isDark
                                ? 'bg-berry-500/20 text-berry-200 border border-berry-500/40'
                                : 'bg-berry-100 text-berry-800 border border-berry-300'
                            }`}
                          >
                            <IconPremium className="w-3 h-3" />
                            Polla final
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${theme.mutedSm}`}>{user.email}</p>
                      <p className={`text-[10px] mt-1 ${theme.mutedSm}`}>
                        {user.picksCount} picks · {user.settledCount} calificados ·{' '}
                        <span className={theme.accent}>{user.totalPoints} pts</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleKnockoutPassport(user)}
                    disabled={savingId === `${user.id}-knockout`}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 ${
                      user.hasKnockoutPassport
                        ? isDark
                          ? 'border border-white/15 text-stone-300 hover:bg-white/5'
                          : 'border border-stone-300 text-stone-600 hover:bg-stone-100'
                        : 'bg-berry-600 hover:bg-berry-500 text-white'
                    }`}
                  >
                    {savingId === `${user.id}-knockout`
                      ? '…'
                      : user.hasKnockoutPassport
                        ? `Quitar ${KNOCKOUT_PASSPORT_LABEL}`
                        : `Activar manualmente`}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {view === 'whatsapp' && (
        <div className="space-y-3">
          <div className={`rounded-xl border p-4 ${theme.cardSoft}`}>
            <p className="font-semibold text-sm mb-1">Números de WhatsApp registrados</p>
            <p className={`text-[11px] ${theme.mutedSm}`}>
              Copia estos números para agregar manualmente a la comunidad de WhatsApp.
            </p>
          </div>
          {(() => {
            const withWa = data?.users.filter((u) => u.whatsapp) ?? []
            const withoutWa = data?.users.filter((u) => !u.whatsapp) ?? []
            return (
              <>
                <div className={`flex gap-2 items-center text-xs ${theme.muted}`}>
                  <span className="font-semibold text-emerald-400">{withWa.length} con número</span>
                  <span>·</span>
                  <span className={theme.mutedSm}>{withoutWa.length} sin número</span>
                </div>
                {withWa.length === 0 && (
                  <p className={`text-center py-8 text-sm ${theme.mutedSm}`}>Ningún jugador ha registrado su WhatsApp aún</p>
                )}
                {withWa.length > 0 && (
                  <>
                    <div className={`rounded-xl border p-3 font-mono text-xs select-all leading-loose ${isDark ? 'border-white/10 bg-black/30' : 'border-stone-200 bg-stone-50'}`}>
                      {withWa.map((u) => u.whatsapp).join('\n')}
                    </div>
                    <p className={`text-[10px] ${theme.mutedSm}`}>Selecciona el bloque de arriba y cópialo para pegarlos en WhatsApp</p>
                    <div className="space-y-2">
                      {withWa.map((u) => (
                        <div key={u.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${theme.cardSoft}`}>
                          <UserAvatar src={u.image} name={u.name} size={36} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{u.name ?? u.displayAlias ?? u.email}</p>
                            <p className={`text-[10px] truncate ${theme.mutedSm}`}>{u.email}</p>
                          </div>
                          <span className={`text-xs font-mono shrink-0 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{u.whatsapp}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )
          })()}
        </div>
      )}

      <div className={`rounded-xl border p-4 text-[11px] leading-relaxed ${theme.cardSoft}`}>
        <p className={`font-semibold text-xs mb-2 ${theme.accent}`}>Cobro de premios (resumen)</p>
        <ul className={`space-y-1 ${theme.muted}`}>
          {PRIZE_CLAIM_RULES.slice(0, 5).map((rule) => (
            <li key={rule} className="flex gap-2">
              <span className="text-berry-400 shrink-0">·</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
