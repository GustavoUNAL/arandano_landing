'use client'

import PollaPushPrompt from '@/components/PollaPushPrompt'
import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <PollaPushPrompt />
    </SessionProvider>
  )
}
