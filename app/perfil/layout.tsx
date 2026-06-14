import PollaPushPrompt from '@/components/PollaPushPrompt'

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PollaPushPrompt />
    </>
  )
}
