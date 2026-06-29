'use client'

import PollaRulesModal from '@/components/sports/PollaRulesModal'
import { IconPremium } from '@/components/sports/SportsIcons'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { PassportRequestRow } from '@/lib/passport-requests'
import {
  CAFE_NAME,
  KNOCKOUT_PASSPORT_LABEL,
  KNOCKOUT_PASSPORT_PRICE_LABEL,
  PASSPORT_PURCHASE_STEPS,
  PRIZE_CLAIM_RULES,
} from '@/lib/polla-rules'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

const RULES_ACCEPT_KEY = 'polla-passport-rules-accepted'
const PAYMENT_QR_SRC = '/images/polla-pago-qr.png'

interface PassportRequestPanelProps {
  isDark?: boolean
  hasKnockoutPassport?: boolean
  passportHolders?: number
  onPassportActivated?: () => void
  className?: string
}

export default function PassportRequestPanel({
  isDark = true,
  hasKnockoutPassport = false,
  passportHolders = 0,
  onPassportActivated,
  className = '',
}: PassportRequestPanelProps) {
  const theme = mundialTheme(isDark)
  const [request, setRequest] = useState<PassportRequestRow | null>(null)
  const [userNote, setUserNote] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rulesOpen, setRulesOpen] = useState(false)
  const [rulesAccepted, setRulesAccepted] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRulesAccepted(window.sessionStorage.getItem(RULES_ACCEPT_KEY) === '1')
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sports/passport-request')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar')
      setRequest(json.request ?? null)
      if (json.hasKnockoutPassport && onPassportActivated) onPassportActivated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [onPassportActivated])

  useEffect(() => {
    if (!hasKnockoutPassport) load()
  }, [hasKnockoutPassport, load])

  useEffect(() => {
    if (!receipt) {
      setReceiptPreview('')
      return
    }
    const url = URL.createObjectURL(receipt)
    setReceiptPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [receipt])

  const acceptRules = () => {
    window.sessionStorage.setItem(RULES_ACCEPT_KEY, '1')
    setRulesAccepted(true)
    setShowForm(true)
  }

  const submit = async () => {
    if (!receipt) {
      setError('Adjunta el comprobante de pago.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      if (userNote.trim()) form.append('userNote', userNote.trim())
      form.append('receipt', receipt)
      const res = await fetch('/api/sports/passport-request', {
        method: 'POST',
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo enviar')
      setRequest(json.request)
      setUserNote('')
      setReceipt(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  if (hasKnockoutPassport) {
    return (
      <div
        className={`rounded-2xl border p-4 ${theme.cardSoft} ${className} ${
          isDark ? 'border-berry-500/30 bg-berry-950/20' : 'border-berry-200 bg-berry-50/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <IconPremium className={`w-5 h-5 ${theme.accentLink}`} />
          <p className={`font-semibold text-sm ${isDark ? 'text-berry-200' : 'text-berry-800'}`}>
            {KNOCKOUT_PASSPORT_LABEL} activo
          </p>
        </div>
        <p className={`text-xs mt-1.5 ${theme.muted}`}>
          Compites en la polla final desde cuartos de final.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`rounded-2xl border p-4 animate-pulse ${theme.cardSoft} ${className}`}>
        <div className={`h-4 w-2/3 rounded ${isDark ? 'bg-white/10' : 'bg-stone-200'}`} />
        <div className={`h-3 w-full mt-2 rounded ${isDark ? 'bg-white/5' : 'bg-stone-100'}`} />
      </div>
    )
  }

  const pending = request?.status === 'pending'
  const rejected = request?.status === 'rejected'

  return (
    <>
      <PollaRulesModal
        open={rulesOpen}
        isDark={isDark}
        requireAccept
        passportHolders={passportHolders}
        onClose={() => setRulesOpen(false)}
        onAccept={acceptRules}
      />

      <section className={`rounded-2xl border overflow-hidden ${theme.cardSoft} ${className}`}>
        <div className={`px-4 py-3 border-b ${theme.border}`}>
          <div className="flex items-center gap-2">
            <IconPremium className={`w-4 h-4 shrink-0 ${theme.accentLink}`} />
            <h3 className="font-semibold text-sm">{KNOCKOUT_PASSPORT_LABEL}</h3>
            <span className={`ml-auto text-xs font-bold ${theme.accent}`}>{KNOCKOUT_PASSPORT_PRICE_LABEL}</span>
          </div>
          <p className={`text-[11px] mt-1 ${theme.mutedSm}`}>
            Pozo actual: {passportHolders} pasaportes · paga, adjunta comprobante y activamos tus puntos
          </p>
        </div>

        <div className="p-4 space-y-4">
          {!rulesAccepted && !pending && (
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className={`w-full py-3 rounded-xl border text-sm font-semibold transition-colors ${
                isDark
                  ? 'border-berry-500/40 bg-berry-950/30 text-berry-200 hover:bg-berry-900/40'
                  : 'border-berry-300 bg-berry-50 text-berry-800 hover:bg-berry-100'
              }`}
            >
              📋 Leer reglamento completo antes de solicitar
            </button>
          )}

          {(rulesAccepted || showForm) && !pending && (
            <>
              <ol className={`space-y-2 text-[11px] leading-relaxed ${theme.muted}`}>
                {PASSPORT_PURCHASE_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-berry-600/30 text-berry-300' : 'bg-berry-100 text-berry-700'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className={`rounded-xl border p-4 text-center ${isDark ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-stone-50'}`}>
                <p className={`text-xs font-semibold mb-3 ${theme.muted}`}>
                  Escanea para pagar {KNOCKOUT_PASSPORT_PRICE_LABEL}
                </p>
                <div className="relative w-44 h-44 mx-auto rounded-xl overflow-hidden bg-white p-2">
                  <Image src={PAYMENT_QR_SRC} alt="QR de pago pasaporte polla" fill className="object-contain" />
                </div>
                <p className={`text-[10px] mt-2 ${theme.mutedSm}`}>{CAFE_NAME} · Nequi / transferencia</p>
              </div>
            </>
          )}

          {pending ? (
            <div
              className={`rounded-xl border px-3 py-3 text-center ${
                isDark ? 'border-amber-500/30 bg-amber-950/25' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <p className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                Solicitud enviada — pendiente de revisión
              </p>
              <p className={`text-[11px] mt-1 ${theme.mutedSm}`}>
                Revisaremos tu comprobante y activaremos el pasaporte para sumar puntos desde cuartos.
              </p>
              {request.userNote && (
                <p className={`text-[10px] mt-2 italic ${theme.mutedSm}`}>Tu nota: {request.userNote}</p>
              )}
            </div>
          ) : (
            rulesAccepted &&
            showForm && (
              <>
                {rejected && (
                  <div
                    className={`rounded-xl border px-3 py-2.5 text-xs ${
                      isDark ? 'border-red-500/30 bg-red-950/20 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
                    }`}
                  >
                    <p className="font-semibold">Solicitud rechazada</p>
                    {request?.adminNote && <p className="mt-1 opacity-90">{request.adminNote}</p>}
                    <p className={`mt-1 ${theme.mutedSm}`}>Vuelve a pagar y adjunta un comprobante válido.</p>
                  </div>
                )}
                <div>
                  <label className={`text-[10px] uppercase tracking-wide font-medium block mb-1 ${theme.mutedSm}`}>
                    Comprobante de pago (obligatorio)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                    className={`w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold ${
                      isDark ? 'file:bg-berry-600 file:text-white' : 'file:bg-berry-100 file:text-berry-800'
                    }`}
                    disabled={submitting}
                  />
                  {receiptPreview && receipt?.type.startsWith('image/') && (
                    <img src={receiptPreview} alt="Vista previa comprobante" className="mt-2 max-h-32 rounded-lg border mx-auto" />
                  )}
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wide font-medium block mb-1 ${theme.mutedSm}`}>
                    Nota opcional (referencia, hora del pago…)
                  </label>
                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    maxLength={280}
                    rows={2}
                    placeholder="Ej: Transferencia Nequi hoy 3:45 pm"
                    className={`w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none ${theme.profileHeroInput}`}
                    disabled={submitting}
                  />
                </div>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || !receipt}
                  className="w-full py-2.5 rounded-xl bg-berry-600 hover:bg-berry-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Enviando…' : `Enviar solicitud con comprobante`}
                </button>
              </>
            )
          )}

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <details className={`text-[10px] ${theme.mutedSm}`}>
            <summary className="cursor-pointer font-medium">Cobro de premios</summary>
            <ul className="mt-2 space-y-1 list-disc pl-4">
              {PRIZE_CLAIM_RULES.slice(0, 4).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    </>
  )
}
