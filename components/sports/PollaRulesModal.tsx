'use client'

import PollaModal from '@/components/sports/PollaModal'
import PollaReglamentoContent from '@/components/sports/PollaReglamentoContent'

interface PollaRulesModalProps {
  open: boolean
  isDark?: boolean
  requireAccept?: boolean
  onClose: () => void
  onAccept?: () => void
  passportHolders?: number
}

export default function PollaRulesModal({
  open,
  isDark = true,
  requireAccept = false,
  passportHolders = 0,
  onClose,
  onAccept,
}: PollaRulesModalProps) {
  return (
    <PollaModal
      open={open}
      onClose={onClose}
      isDark={isDark}
      accent="berry"
      size="lg"
      zIndex={110}
      allowBackdropClose={!requireAccept}
      icon={<span className="text-2xl">📋</span>}
      title="Reglamento de la polla"
      subtitle="Fase de grupos, pasaporte polla final, premios y reglas desde octavos."
      footer={
        requireAccept ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-white/5 transition-colors"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={() => {
                onAccept?.()
                onClose()
              }}
              className="flex-[2] py-2.5 rounded-xl bg-berry-600 hover:bg-berry-500 text-white text-sm font-semibold"
            >
              Acepto — continuar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-white/15 text-sm font-semibold hover:bg-white/5 transition-colors"
          >
            Cerrar
          </button>
        )
      }
    >
      <PollaReglamentoContent isDark={isDark} passportHolders={passportHolders} />
    </PollaModal>
  )
}
