'use client'

import PollaRulesModal from '@/components/sports/PollaRulesModal'
import { IconPremium } from '@/components/sports/SportsIcons'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { PassportRequestRow } from '@/lib/passport-requests'
import {
  CAFE_NAME,
  KNOCKOUT_PASSPORT_LABEL,
  KNOCKOUT_PASSPORT_PRICE_LABEL,
  PRIZE_CLAIM_RULES,
} from '@/lib/polla-rules'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

const RULES_ACCEPT_KEY = 'polla-passport-rules-accepted'
const PAYMENT_QR_SRC = '/images/polla-pago-qr.png'

type ModalStep = 'rules' | 'payment' | 'upload' | 'success'

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
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<ModalStep>('rules')
  const [rulesOpen, setRulesOpen] = useState(false)
  const [rulesAccepted, setRulesAccepted] = useState(false)
  const [userNote, setUserNote] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onPassportActivatedRef = useRef(onPassportActivated)
  onPassportActivatedRef.current = onPassportActivated
  const modalOpenRef = useRef(modalOpen)
  modalOpenRef.current = modalOpen

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRulesAccepted(window.sessionStorage.getItem(RULES_ACCEPT_KEY) === '1')
    }
  }, [])

  const load = useCallback(async () => {
    if (modalOpenRef.current) return
    setLoading(true)
    try {
      const res = await fetch('/api/sports/passport-request')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar')
      setRequest(json.request ?? null)
      if (json.hasKnockoutPassport && onPassportActivatedRef.current) onPassportActivatedRef.current()
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasKnockoutPassport) load()
  }, [hasKnockoutPassport, load])

  useEffect(() => {
    if (!receipt) { setReceiptPreview(''); return }
    const url = URL.createObjectURL(receipt)
    setReceiptPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [receipt])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [modalOpen])

  const openModal = () => {
    setError('')
    setStep(rulesAccepted ? 'payment' : 'rules')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
  }

  const acceptRules = () => {
    window.sessionStorage.setItem(RULES_ACCEPT_KEY, '1')
    setRulesAccepted(true)
    setRulesOpen(false)
    setStep('payment')
  }

  const submit = async () => {
    if (!receipt) { setError('Adjunta el comprobante de pago.'); return }
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      if (userNote.trim()) form.append('userNote', userNote.trim())
      form.append('receipt', receipt)
      const res = await fetch('/api/sports/passport-request', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo enviar')
      setRequest(json.request)
      setUserNote('')
      setReceipt(null)
      setStep('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  // — Estado: pasaporte ya activo —
  if (hasKnockoutPassport) {
    return (
      <div className={`rounded-2xl border p-4 ${className} ${isDark ? 'border-berry-500/30 bg-berry-950/20' : 'border-berry-200 bg-berry-50/80'}`}>
        <div className="flex items-center gap-2">
          <IconPremium className={`w-5 h-5 ${theme.accentLink}`} />
          <p className={`font-semibold text-sm ${isDark ? 'text-berry-200' : 'text-berry-800'}`}>
            {KNOCKOUT_PASSPORT_LABEL} activo
          </p>
        </div>
        <p className={`text-xs mt-1.5 ${theme.muted}`}>Compites en la polla final desde cuartos de final.</p>
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
      {/* PollaRulesModal (step dentro del modal de compra) */}
      <PollaRulesModal
        open={rulesOpen}
        isDark={isDark}
        requireAccept
        passportHolders={passportHolders}
        onClose={() => setRulesOpen(false)}
        onAccept={acceptRules}
      />

      {/* Tarjeta trigger compacta */}
      <div className={`rounded-2xl border overflow-hidden ${theme.cardSoft} ${className}`}>
        <div className={`px-4 py-3 border-b ${theme.border} flex items-center gap-2`}>
          <IconPremium className={`w-4 h-4 shrink-0 ${theme.accentLink}`} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Adquiere tu pasaporte</p>
            <p className={`text-[10px] ${theme.mutedSm}`}>
              {KNOCKOUT_PASSPORT_LABEL} · {KNOCKOUT_PASSPORT_PRICE_LABEL}
            </p>
          </div>
          {pending ? (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
              En revisión
            </span>
          ) : (
            <span className={`text-[10px] font-bold ${theme.accent}`}>{passportHolders} activos</span>
          )}
        </div>

        <div className="px-4 py-3">
          {pending ? (
            <div className={`rounded-xl border px-3 py-2.5 text-center ${isDark ? 'border-amber-500/30 bg-amber-950/25' : 'border-amber-200 bg-amber-50'}`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                Solicitud enviada — en revisión
              </p>
              <p className={`text-[11px] mt-1 ${theme.mutedSm}`}>
                Activaremos tu pasaporte una vez verificado el comprobante.
              </p>
              {request?.userNote && (
                <p className={`text-[10px] mt-1 italic ${theme.mutedSm}`}>Nota: {request.userNote}</p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openModal}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isDark
                  ? 'bg-berry-600 hover:bg-berry-500 text-white'
                  : 'bg-berry-600 hover:bg-berry-700 text-white'
              }`}
            >
              {rejected ? 'Volver a solicitar →' : 'Adquirir pasaporte →'}
            </button>
          )}
        </div>
      </div>

      {/* ── Modal de compra ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${
              isDark ? 'bg-stone-950 border-white/10' : 'bg-white border-stone-200'
            }`}
          >
            {/* Header modal */}
            <div className={`px-5 pt-5 pb-4 border-b shrink-0 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <IconPremium className={`w-4 h-4 ${theme.accentLink}`} />
                    <p className="font-semibold text-sm">Adquiere tu pasaporte</p>
                  </div>
                  <p className={`text-[11px] ${theme.mutedSm}`}>
                    {KNOCKOUT_PASSPORT_PRICE_LABEL} · {CAFE_NAME}
                  </p>
                </div>
                {!submitting && (
                  <button
                    type="button"
                    onClick={closeModal}
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                      isDark ? 'hover:bg-white/10 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
                    }`}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Stepper */}
              {step !== 'success' && (
                <div className="flex items-center gap-2 mt-4">
                  {(['rules', 'payment', 'upload'] as ModalStep[]).map((s, i) => {
                    const labels = ['Reglamento', 'Pago', 'Comprobante']
                    const active = step === s
                    const done = (step === 'payment' && i === 0) || (step === 'upload' && i <= 1)
                    return (
                      <div key={s} className="flex items-center gap-1.5 flex-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          done
                            ? (isDark ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white')
                            : active
                              ? 'bg-berry-600 text-white'
                              : (isDark ? 'bg-white/10 text-stone-500' : 'bg-stone-200 text-stone-500')
                        }`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <p className={`text-[10px] font-medium truncate ${active ? (isDark ? 'text-white' : 'text-stone-900') : theme.mutedSm}`}>
                          {labels[i]}
                        </p>
                        {i < 2 && <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-stone-200'}`} />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* STEP: rules */}
              {step === 'rules' && (
                <>
                  <p className={`text-sm ${theme.muted}`}>
                    Antes de adquirir el pasaporte, lee el reglamento de la polla final para conocer cómo funcionan los puntos, premios y requisitos.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRulesOpen(true)}
                    className={`w-full py-3 rounded-xl border text-sm font-semibold transition-colors ${
                      isDark
                        ? 'border-berry-500/40 bg-berry-950/30 text-berry-200 hover:bg-berry-900/40'
                        : 'border-berry-300 bg-berry-50 text-berry-800 hover:bg-berry-100'
                    }`}
                  >
                    📋 Leer y aceptar el reglamento
                  </button>
                  <details className={`text-[10px] ${theme.mutedSm}`}>
                    <summary className="cursor-pointer font-medium">Reglas de cobro de premios</summary>
                    <ul className="mt-2 space-y-1 list-disc pl-4">
                      {PRIZE_CLAIM_RULES.slice(0, 4).map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </details>
                </>
              )}

              {/* STEP: payment */}
              {step === 'payment' && (
                <>
                  <div className={`rounded-xl border p-4 text-center ${isDark ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-stone-50'}`}>
                    <p className={`text-xs font-semibold mb-3 ${theme.muted}`}>
                      Escanea y paga {KNOCKOUT_PASSPORT_PRICE_LABEL}
                    </p>
                    <div className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden bg-white p-2">
                      <Image src={PAYMENT_QR_SRC} alt="QR de pago pasaporte polla" fill className="object-contain" />
                    </div>
                    <p className={`text-[10px] mt-2 ${theme.mutedSm}`}>{CAFE_NAME} · Nequi / transferencia</p>
                  </div>
                  <ol className={`space-y-2 text-[11px] leading-relaxed ${theme.muted}`}>
                    {[
                      `Paga ${KNOCKOUT_PASSPORT_PRICE_LABEL} escaneando el QR (Nequi / transferencia).`,
                      'Guarda el comprobante — lo vas a necesitar en el siguiente paso.',
                      'Un administrador revisará tu solicitud y activará el pasaporte.',
                    ].map((step, i) => (
                      <li key={step} className="flex gap-2">
                        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${isDark ? 'bg-berry-600/30 text-berry-300' : 'bg-berry-100 text-berry-700'}`}>
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {/* STEP: upload */}
              {step === 'upload' && (
                <>
                  {rejected && (
                    <div className={`rounded-xl border px-3 py-2.5 text-xs ${isDark ? 'border-red-500/30 bg-red-950/20 text-red-200' : 'border-red-200 bg-red-50 text-red-800'}`}>
                      <p className="font-semibold">Solicitud rechazada</p>
                      {request?.adminNote && <p className="mt-1 opacity-90">{request.adminNote}</p>}
                      <p className={`mt-1 ${theme.mutedSm}`}>Vuelve a pagar y adjunta un comprobante válido.</p>
                    </div>
                  )}

                  <div>
                    <label className={`text-[10px] uppercase tracking-wide font-medium block mb-1.5 ${theme.mutedSm}`}>
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
                      <img src={receiptPreview} alt="Vista previa comprobante" className="mt-2 max-h-36 rounded-lg border mx-auto block" />
                    )}
                  </div>

                  <div>
                    <label className={`text-[10px] uppercase tracking-wide font-medium block mb-1.5 ${theme.mutedSm}`}>
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

                  {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                </>
              )}

              {/* STEP: success */}
              {step === 'success' && (
                <div className="py-4 text-center space-y-4">
                  <div className="text-5xl">🎉</div>
                  <div>
                    <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      ¡Solicitud enviada!
                    </p>
                    <p className={`text-sm mt-1 ${theme.muted}`}>
                      Revisaremos tu comprobante y activaremos el pasaporte para que sumes puntos desde cuartos.
                    </p>
                  </div>
                  <div className={`rounded-xl border px-4 py-3 text-xs text-left space-y-1 ${isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50'}`}>
                    <p className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>¿Qué sigue?</p>
                    <p className={theme.mutedSm}>Un administrador revisará tu solicitud y te activará el pasaporte.</p>
                    <p className={theme.mutedSm}>Una vez activo, tus puntos desde cuartos de final contarán en la polla final.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer modal con botones de acción */}
            <div className={`px-5 pb-6 pt-3 shrink-0 border-t space-y-2 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
              {step === 'rules' && (
                <p className={`text-[10px] text-center ${theme.mutedSm}`}>
                  Debes leer y aceptar el reglamento para continuar
                </p>
              )}

              {step === 'payment' && (
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="w-full py-3 rounded-xl bg-berry-600 hover:bg-berry-500 text-white text-sm font-semibold transition-colors"
                >
                  Ya pagué — adjuntar comprobante →
                </button>
              )}

              {step === 'upload' && (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || !receipt}
                  className="w-full py-3 rounded-xl bg-berry-600 hover:bg-berry-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Enviando…' : 'Enviar solicitud con comprobante'}
                </button>
              )}

              {step === 'success' && (
                <button
                  type="button"
                  onClick={closeModal}
                  className={`w-full py-3 rounded-xl text-sm font-semibold border transition-colors ${isDark ? 'border-white/15 text-stone-200 hover:bg-white/5' : 'border-stone-300 text-stone-700 hover:bg-stone-100'}`}
                >
                  Cerrar
                </button>
              )}

              {(step === 'payment' || step === 'upload') && !submitting && (
                <button
                  type="button"
                  onClick={() => setStep(step === 'upload' ? 'payment' : 'rules')}
                  className={`w-full py-2 text-xs font-medium ${theme.mutedSm} hover:underline`}
                >
                  ← Volver
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
