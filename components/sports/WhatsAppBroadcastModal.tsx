'use client'

import PollaModal from '@/components/sports/PollaModal'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { formatWhatsAppForDisplay } from '@/lib/whatsapp-utils'
import { useEffect, useState } from 'react'

interface WhatsAppBroadcastModalProps {
  open: boolean
  userName?: string | null
  isDark?: boolean
  onSubmit: (whatsapp: string) => Promise<void>
  onSkip: () => Promise<void>
}

export default function WhatsAppBroadcastModal({
  open,
  userName,
  isDark = true,
  onSubmit,
  onSkip,
}: WhatsAppBroadcastModalProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!open) {
      setPhone('')
      setError('')
      setPreview('')
    }
  }, [open])

  useEffect(() => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length >= 10) {
      const normalized =
        digits.startsWith('57') && digits.length === 12
          ? digits
          : digits.length === 10 && digits.startsWith('3')
            ? `57${digits}`
            : null
      setPreview(normalized ? formatWhatsAppForDisplay(normalized) : '')
    } else {
      setPreview('')
    }
  }, [phone])

  const greeting = userName?.split(' ')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit(phone)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el número')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PollaModal
      open={open}
      onClose={() => void onSkip()}
      isDark={isDark}
      accent="emerald"
      size="sm"
      zIndex={100}
      icon={
        <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
          <WhatsAppIcon size={24} className="text-white" />
        </div>
      }
      title="Canal de difusión"
      subtitle={
        greeting
          ? `Hola ${greeting}, déjanos tu WhatsApp para novedades del Mundial en Arándano.`
          : 'Resultados, recordatorios y novedades de la polla por WhatsApp.'
      }
      footer={
        <div className="space-y-2">
          <button
            type="submit"
            form="whatsapp-broadcast-form"
            disabled={saving || !phone.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-emerald-900/25 transition-all"
          >
            {saving ? 'Guardando…' : 'Unirme al canal'}
          </button>
          <button
            type="button"
            onClick={() => void onSkip()}
            disabled={saving}
            className="w-full py-2 text-xs text-stone-500 hover:text-stone-400 disabled:opacity-50"
          >
            Ahora no
          </button>
        </div>
      }
    >
      <form id="whatsapp-broadcast-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-stone-400">Tu celular colombiano</span>
          <div className="mt-2 flex rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/40 border-white/10">
            <span className="px-3 py-3 text-sm font-semibold border-r border-white/10 bg-white/5 text-stone-300 shrink-0">
              +57
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="300 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 min-w-0 px-3 py-3 text-sm bg-transparent outline-none text-white placeholder:text-stone-500"
              disabled={saving}
            />
          </div>
          {preview && <p className="text-[10px] mt-1.5 text-stone-500">Se guardará como {preview}</p>}
        </label>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </form>
    </PollaModal>
  )
}
