import {
  Menu,
} from 'lucide-react'
import type { Message } from '../lib/api'
import ChatMessage from './ChatMessage'
import Composer from './Composer'
import OrbitMark from './OrbitMark'


type ChatAreaProps = {
  messages: Message[]
  loading: boolean
  sending: boolean
  disabled: boolean
  hasConversation: boolean
  onSend: (message: string) => void
  onOpenSidebar: () => void
}

const starterPrompts = [
  'Help me plan my day',
  'Explain something I’m learning',
  'Help me think through a problem',
  'What can you help me with?',
]

function ChatArea({
  messages,
  loading,
  sending,
  disabled,
  hasConversation,
  onSend,
  onOpenSidebar,
}: ChatAreaProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#0b0b0b]">
      <header className="flex h-14 shrink-0 items-center border-b border-zinc-800 px-4 md:px-6">
        <button
          onClick={onOpenSidebar}
          className="mr-3 rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white md:hidden"
        >
          <Menu size={19} />
        </button>

        <div className="flex items-center gap-2.5">
          <OrbitMark
            size={28}
            className="text-zinc-200"
          />

          <div>
            <span className="text-sm font-semibold tracking-[0.25em] text-zinc-100">
              ORBIT
            </span>

            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ready to help
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6">
            <div className="w-full max-w-2xl text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl">
                <OrbitMark size={54} />
              </div>

              <h2 className="text-3xl font-semibold tracking-tight">
                How can I help you today?
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                Ask questions, work through ideas, manage
                tasks, or just talk. Orbit is here to help.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={sending}
                    onClick={() => onSend(prompt)}
                    className="group flex min-h-12 items-center justify-between rounded-xl border border-zinc-800 px-4 text-left text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{prompt}</span>

                    <span className="ml-4 text-zinc-600 transition group-hover:text-zinc-300">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
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
          </div>
        )}
      </div>

      <Composer
        disabled={disabled}
        hasConversation={hasConversation}
        onSend={onSend}
      />
    </section>
  )
}

export default ChatArea