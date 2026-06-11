import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'

export async function getAuthUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) return null
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  }
}
