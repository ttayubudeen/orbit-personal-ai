import { Menu, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Message } from '../lib/api'
import ChatMessage from './ChatMessage'
import Composer from './Composer'

interface ChatAreaProps {
  messages: Message[]
  loading: boolean
  sending: boolean
  onSend: (message: string) => void
  onOpenSidebar: () => void
}

function ChatArea({
  messages,
  loading,
  sending,
  onSend,
  onOpenSidebar,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages, sending])

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0b0b0b]">
      <header className="flex h-14 shrink-0 items-center border-b border-zinc-800 px-4 md:px-6">
        <button
          onClick={onOpenSidebar}
          className="mr-3 rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white md:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={19} />
        </button>

        <div className="flex items-center gap-2">
          <Sparkles size={17} className="text-zinc-400" />
          <span className="text-sm font-medium">
            Assistant
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                <Sparkles size={24} />
              </div>

              <h2 className="text-2xl font-semibold tracking-tight">
                How can I help?
              </h2>

              <p className="mt-2 text-sm text-zinc-600">
                Ask me anything.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 md:px-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
              />
            ))}

            {sending && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500" />
                Thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0">
        <Composer
          disabled={sending || loading}
          onSend={onSend}
        />
      </div>
    </section>
  )
}

export default ChatArea