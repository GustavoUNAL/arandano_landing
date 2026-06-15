export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startPollaPushScheduler } = await import('@/lib/polla-push-scheduler')
    startPollaPushScheduler()
  }
}
