'use server'
import { cookies } from 'next/headers'
import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'

export async function registerCustomer(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string

  const res = await fetch(`${BACKEND_URL}/store/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY },
    body: JSON.stringify({ email, password, first_name, last_name }),
  })
  if (!res.ok) return { error: await res.text() }

  const loginRes = await fetch(`${BACKEND_URL}/auth/customer/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY },
    body: JSON.stringify({ email, password }),
  })
  const { token } = await loginRes.json()
  const store = await cookies()
  store.set('medusa_auth_token', token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return { success: true }
}

export async function loginCustomer(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const res = await fetch(`${BACKEND_URL}/auth/customer/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) return { error: await res.text() }
  const { token } = await res.json()
  const store = await cookies()
  store.set('medusa_auth_token', token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return { success: true }
}

export async function logoutCustomer() {
  const store = await cookies()
  store.delete('medusa_auth_token')
}