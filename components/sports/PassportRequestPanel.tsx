'use client'

import { IconPremium } from '@/components/sports/SportsIcons'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { PassportRequestRow } from '@/lib/passport-requests'
import {
  CAFE_NAME,
  KNOCKOUT_PASSPORT_LABEL,
  KNOCKOUT_PASSPORT_PRICE_LABEL,
  KNOCKOUT_PASSPORT_RULES,
  PRIZE_CLAIM_RULES,
} from '@/lib/polla-rules'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

const PAYMENT_QR_SRC = '/images/polla-pago-qr.png'
const ACCOUNT_KEY = '0091616772'

type ModalStep = 'rules' | 'payment' | 'upload' | 'success'

interface PassportRequestPanelProps {
  isDark?: boolean
  hasKnockoutPassport?: boolean
  passportHolders?: number
  onPassportActivated?: () => void
  className?: string
}

function CopyButton({ text, isDark }: { text: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`ml-2 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
        copied
          ? 'bg-emerald-600 text-white'
          : isDark
            ? 'bg-white/10 text-stone-300 hover:bg-white/20'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
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
    if (!receipt) { setReceiptPreview(''); return }
    const url = URL.createObjectURL(receipt)
    setReceiptPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [receipt])

  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [modalOpen])

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

  const openModal = () => {
    setError('')
    setRulesAccepted(false)
    setStep('rules')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
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

  // — Pasaporte ya activo —
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
      {/* Tarjeta trigger */}
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
              <p className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>Solicitud enviada — en revisión</p>
              <p className={`text-[11px] mt-1 ${theme.mutedSm}`}>Activaremos tu pasaporte una vez verificado el comprobante.</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={openModal}
              className="w-full py-2.5 rounded-xl bg-berry-600 hover:bg-berry-500 text-white text-sm font-semibold transition-colors"
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
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) closeModal() }}
        >
          <div
            className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${
              isDark ? 'bg-stone-950 border-white/10' : 'bg-white border-stone-200'
            }`}
          >
            {/* Header */}
            <div className={`px-5 pt-5 pb-4 border-b shrink-0 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <IconPremium className={`w-4 h-4 ${theme.accentLink}`} />
                    <p className="font-semibold text-sm">Adquiere tu pasaporte</p>
                  </div>
                  <p className={`text-[11px] ${theme.mutedSm}`}>{KNOCKOUT_PASSPORT_PRICE_LABEL} · {CAFE_NAME}</p>
                </div>
                {!submitting && step !== 'success' && (
                  <button
                    type="button"
                    onClick={closeModal}
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${isDark ? 'hover:bg-white/10 text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}
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
                          done ? 'bg-emerald-500 text-white' : active ? 'bg-berry-600 text-white' : isDark ? 'bg-white/10 text-stone-500' : 'bg-stone-200 text-stone-500'
                        }`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <p className={`text-[10px] font-medium truncate ${active ? (isDark ? 'text-white' : 'text-stone-900') : theme.mutedSm}`}>{labels[i]}</p>
                        {i < 2 && <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-stone-200'}`} />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* STEP 1: Reglamento inline */}
              {step === 'rules' && (
                <>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    Reglamento de la polla final
                  </p>

                  <div className={`rounded-xl border divide-y text-xs leading-relaxed ${isDark ? 'border-white/10 divide-white/5' : 'border-stone-200 divide-stone-100'}`}>
                    {KNOCKOUT_PASSPORT_RULES.map((rule, i) => (
                      <div key={i} className={`px-3 py-2.5 flex gap-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                        <span className={`font-bold shrink-0 ${isDark ? 'text-berry-400' : 'text-berry-600'}`}>{i + 1}.</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>

                  <p className={`text-[11px] font-semibold ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>Cobro de premios</p>
                  <div className={`rounded-xl border divide-y text-xs leading-relaxed ${isDark ? 'border-white/10 divide-white/5' : 'border-stone-200 divide-stone-100'}`}>
                    {PRIZE_CLAIM_RULES.slice(0, 5).map((rule, i) => (
                      <div key={i} className={`px-3 py-2 flex gap-2 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        <span className={`shrink-0 ${isDark ? 'text-berry-500' : 'text-berry-500'}`}>·</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>

                  {/* Checkbox de aceptación */}
                  <label className={`flex items-start gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-colors ${
                    rulesAccepted
                      ? isDark ? 'border-emerald-500/50 bg-emerald-950/25' : 'border-emerald-300 bg-emerald-50'
                      : isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={rulesAccepted}
                      onChange={(e) => setRulesAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-berry-600 shrink-0"
                    />
                    <span className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                      He leído y acepto el reglamento de la polla final y las reglas de cobro de premios.
                    </span>
                  </label>
                </>
              )}

              {/* STEP 2: Pago con QR + llave */}
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

                  {/* Llave de cuenta */}
                  <div className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] uppercase tracking-wide font-medium mb-0.5 ${theme.mutedSm}`}>Llave de cuenta</p>
                      <p className={`font-mono text-sm font-bold tracking-widest ${isDark ? 'text-white' : 'text-stone-900'}`}>{ACCOUNT_KEY}</p>
                    </div>
                    <CopyButton text={ACCOUNT_KEY} isDark={isDark} />
                  </div>

                  <ol className={`space-y-2 text-[11px] leading-relaxed ${theme.muted}`}>
                    {[
                      `Paga ${KNOCKOUT_PASSPORT_PRICE_LABEL} escaneando el QR o usando la llave de cuenta (Nequi / transferencia).`,
                      'Guarda el comprobante — lo necesitas en el siguiente paso.',
                      'Un administrador revisará tu solicitud y activará el pasaporte.',
                    ].map((t, i) => (
                      <li key={i} className="flex gap-2">
                        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${isDark ? 'bg-berry-600/30 text-berry-300' : 'bg-berry-100 text-berry-700'}`}>{i + 1}</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {/* STEP 3: Comprobante */}
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
                      className={`w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold ${isDark ? 'file:bg-berry-600 file:text-white' : 'file:bg-berry-100 file:text-berry-800'}`}
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
                      placeholder="Ej: Nequi hoy 3:45 pm"
                      className={`w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none ${theme.profileHeroInput}`}
                      disabled={submitting}
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                </>
              )}

              {/* STEP 4: Éxito */}
              {step === 'success' && (
                <div className="py-4 text-center space-y-4">
                  <div className="text-5xl">🎉</div>
                  <div>
                    <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-stone-900'}`}>¡Solicitud enviada!</p>
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

            {/* Footer */}
            <div className={`px-5 pb-6 pt-3 shrink-0 border-t space-y-2 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
              {step === 'rules' && (
                <>
                  {!rulesAccepted && (
                    <p className={`text-[10px] text-center ${theme.mutedSm}`}>
                      Marca la casilla de aceptación para continuar
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    disabled={!rulesAccepted}
                    className="w-full py-3 rounded-xl bg-berry-600 hover:bg-berry-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                  >
                    Acepto el reglamento — continuar →
                  </button>
                </>
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
                  onClick={() => void submit()}
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
