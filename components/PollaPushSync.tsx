'use client'

import { syncPollaPushSubscription } from '@/lib/push-notifications'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/** Mantiene la suscripción push al día cuando el usuario vuelve a la polla */
export default function PollaPushSync() {
  const { status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return
    void syncPollaPushSubscription()
  }, [status])

  return null
}
