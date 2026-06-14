import type { Metadata } from 'next'
import PollaPushPrompt from '@/components/PollaPushPrompt'

export const metadata: Metadata = {
  title: 'Polla Mundialista | Arándano Café Bar',
  description:
    'Vive el Mundial 2026 con Arándano Café Bar. Juega la polla mundialista con tus amigos, haz pronósticos y demuestra que eres un experto.',
}

export default function MundialLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PollaPushPrompt />
    </>
  )
}
