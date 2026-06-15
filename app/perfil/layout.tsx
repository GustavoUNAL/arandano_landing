import PollaPushPrompt from '@/components/PollaPushPrompt'
import PollaPushSync from '@/components/PollaPushSync'

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PollaPushPrompt />
      <PollaPushSync />
    </>
  )
}
