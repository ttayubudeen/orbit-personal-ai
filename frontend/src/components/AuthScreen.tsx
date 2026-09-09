import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserPlus,
} from 'lucide-react'
import { login, register } from '../lib/api'
import OrbitMark from './OrbitMark'


interface AuthScreenProps {
  onAuthenticated: () => void
}

function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result =
        mode === 'login'
          ? await login(email, password)
          : await register(name, email, password)

      localStorage.setItem('access_token', result.access_token)
      onAuthenticated()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode((current) => (current === 'login' ? 'register' : 'login'))
    setError('')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-zinc-500/[0.02] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-white shadow-2xl">
            <OrbitMark size={42} />
          </div>

          <h1 className="text-2xl font-semibold tracking-[0.22em] text-white">
            ORBIT
          </h1>

          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-zinc-600">
            Personal AI Assistant
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            {mode === 'login'
              ? 'Welcome back. Let’s pick up where you left off.'
              : 'Create your private assistant workspace.'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-zinc-400">
                  Name
                </span>

                <div className="relative">
                  <UserPlus
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600 focus:bg-zinc-900"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-zinc-400">
                Email
              </span>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600 focus:bg-zinc-900"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-zinc-400">
                Password
              </span>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  required
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600 focus:bg-zinc-900"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-3.5 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}

              {!loading && (
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[11px] text-zinc-600">OR</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={toggleMode}
            className="w-full rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
          >
            {mode === 'login'
              ? 'Create a new account'
              : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] text-zinc-700">
          Personal AI assistant • Private workspace
        </p>
      </div>
    </div>
  )
}

export default AuthScreen