import { authOptions } from '@/lib/auth'
import { applyNextAuthUrlFromHeaders } from '@/lib/auth-url'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'

export async function getAuthUser() {
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
