'use client'
import { useState, useTransition } from 'react'
import { loginCustomer } from '@/actions/auth'

export default function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await loginCustomer(formData)
      if ('error' in res) setError(res.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input name="email" type="email" placeholder="Email" required className="w-full rounded border px-3 py-2" />
      <input name="password" type="password" placeholder="Password" required className="w-full rounded border px-3 py-2" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={isPending} className="w-full rounded bg-sonom-primary px-4 py-2 text-white">
        {isPending ? 'Loading...' : 'Login'}
      </button>
    </form>
  )
}