import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  RefreshCw,
  Users,
} from 'lucide-react'
import {
  getAdminUsage,
  type AdminUsage as AdminUsageData,
} from '../lib/api'

interface AdminUsageProps {
  onBack: () => void
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function AdminUsage({ onBack }: AdminUsageProps) {
  const [data, setData] = useState<AdminUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadUsage(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      const result = await getAdminUsage()
      setData(result)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load usage data.'

      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadUsage()
  }, [])

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-[#0b0b0b] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
            aria-label="Back to assistant"
            title="Back to assistant"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="flex items-center gap-2">
            <BarChart3 size={17} className="text-zinc-400" />
            <span className="text-sm font-medium">
              Usage
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadUsage(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={refreshing ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              Admin
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Usage overview
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              AI usage for {data?.period ?? 'the current period'}.
            </p>
          </div>

          {loading && (
            <div className="flex min-h-64 items-center justify-center text-sm text-zinc-600">
              Loading usage...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-5">
              <p className="text-sm font-medium text-red-300">
                Unable to load usage
              </p>

              <p className="mt-1 text-sm text-red-400/80">
                {error}
              </p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-8">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Activity size={15} className="text-zinc-500" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Overview
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <StatCard
                    label="AI Requests"
                    value={formatNumber(
                      data.summary.ai_requests,
                    )}
                  />

                  <StatCard
                    label="Input Tokens"
                    value={formatNumber(
                      data.summary.input_tokens,
                    )}
                  />

                  <StatCard
                    label="Output Tokens"
                    value={formatNumber(
                      data.summary.output_tokens,
                    )}
                  />

                  <StatCard
                    label="Total Tokens"
                    value={formatNumber(
                      data.summary.total_tokens,
                    )}
                  />

                  <StatCard
                    label="Users"
                    value={formatNumber(data.summary.users)}
                  />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 size={15} className="text-zinc-500" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    By model
                  </h2>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b border-zinc-800 bg-zinc-900/40 text-xs text-zinc-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">
                            Provider
                          </th>
                          <th className="px-4 py-3 font-medium">
                            Model
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Requests
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Input
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Output
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-zinc-800/70">
                        {data.by_model.map((item) => (
                          <tr
                            key={`${item.provider}-${item.model}`}
                            className="text-zinc-400"
                          >
                            <td className="px-4 py-3">
                              {item.provider}
                            </td>

                            <td className="px-4 py-3 font-medium text-zinc-200">
                              {item.model}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {formatNumber(item.requests)}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {formatNumber(item.input_tokens)}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {formatNumber(item.output_tokens)}
                            </td>

                            <td className="px-4 py-3 text-right text-zinc-200">
                              {formatNumber(item.total_tokens)}
                            </td>
                          </tr>
                        ))}

                        {data.by_model.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-sm text-zinc-600"
                            >
                              No model usage recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Users size={15} className="text-zinc-500" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    By user
                  </h2>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="border-b border-zinc-800 bg-zinc-900/40 text-xs text-zinc-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">
                            User
                          </th>
                          <th className="px-4 py-3 font-medium">
                            Email
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Requests
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Input
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Output
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-zinc-800/70">
                        {data.by_user.map((item) => (
                          <tr
                            key={item.user_id}
                            className="text-zinc-400"
                          >
                            <td className="px-4 py-3 font-medium text-zinc-200">
                              {item.name}
                            </td>

                            <td className="px-4 py-3">
                              {item.email}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {formatNumber(item.requests)}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {formatNumber(item.input_tokens)}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {formatNumber(item.output_tokens)}
                            </td>

                            <td className="px-4 py-3 text-right text-zinc-200">
                              {formatNumber(item.total_tokens)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

interface StatCardProps {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
        {value}
      </p>
    </div>
  )
}

export default AdminUsage