import { authOptions } from '@/lib/auth'
import { applyNextAuthUrlFromHeaders } from '@/lib/auth-url'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'

export type AuthUser = {
  id: string
  email: string
  name?: string | null
  image?: string | null
}

export async function getAuthUser(): Promise<AuthUser | null> {
  applyNextAuthUrlFromHeaders(headers())
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) return null
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  }
}
