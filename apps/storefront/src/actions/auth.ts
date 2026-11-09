'use server'

import { cookies } from 'next/headers'
import { storeFetch, StoreApiError } from '@/lib/api'
import { AUTH_COOKIE } from '@/lib/constants'

type AuthResult = { success: true } | { error: string }

function errorMessage(error: unknown): string {
  if (error instanceof StoreApiError) {
    try {
      const parsed = JSON.parse(error.body) as { message?: string }
      if (parsed.message) {
        return parsed.message
      }
    } catch {
      // Keep the generic message below.
    }
  }

  return 'No se pudo completar la operacion. Intenta nuevamente.'
}

async function persistToken(token: string): Promise<void> {
  const store = await cookies()
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function registerCustomer(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const first_name = String(formData.get('first_name') ?? '')
  const last_name = String(formData.get('last_name') ?? '')

  try {
    await storeFetch('/store/customers', {
      method: 'POST',
      body: JSON.stringify({ email, password, first_name, last_name }),
      cache: 'no-store',
    })

    const login = await storeFetch<{ token?: string }>(
      '/auth/customer/emailpass',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      },
    )

    if (!login.token) {
      return { error: 'La cuenta fue creada, pero no se pudo iniciar sesion.' }
    }

    await persistToken(login.token)
    return { success: true }
  } catch (error) {
    console.error('[sonom/storefront] registerCustomer failed', error)
    return { error: errorMessage(error) }
  }
}

export async function loginCustomer(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  try {
    const login = await storeFetch<{ token?: string }>(
      '/auth/customer/emailpass',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      },
    )

    if (!login.token) {
      return { error: 'Credenciales invalidas.' }
    }

    await persistToken(login.token)
    return { success: true }
  } catch (error) {
    console.error('[sonom/storefront] loginCustomer failed', error)
    return { error: errorMessage(error) }
  }
}

export async function logoutCustomer(): Promise<void> {
  const store = await cookies()
  store.delete(AUTH_COOKIE)
}
