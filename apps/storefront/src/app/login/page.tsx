import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import LoginForm from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-16">
        <h1 className="mb-6 text-center text-2xl font-bold text-sonom-text">Login</h1>
        <LoginForm />
      </main>
      <Footer />
    </>
  )
}