import {
  LogOut,
  MessageSquare,
  Plus,
  X,
} from 'lucide-react'
import type { Conversation, User } from '../lib/api'
import OrbitMark from './OrbitMark'


interface SidebarProps {
  user: User
  conversations: Conversation[]
  activeConversationId: string | null
  mobileOpen: boolean
  onMobileClose: () => void
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onLogout: () => void
}

function Sidebar({
  user,
  conversations,
  activeConversationId,
  mobileOpen,
  onMobileClose,
  onNewChat,
  onSelectConversation,
  onLogout,
}: SidebarProps) {
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onMobileClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-zinc-800/70 bg-[#0d0d0f] transition-transform duration-200 lg:static lg:w-[280px] lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <OrbitMark
              size={30}
              className="text-zinc-200"
            />

            <div>
              <div className="text-sm font-semibold tracking-[0.25em] text-zinc-100">
                ORBIT
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                Personal AI
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={onNewChat}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <Plus size={17} />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="px-2 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
            Conversations
          </div>

          <div className="space-y-0.5">
            {conversations.map((conversation) => {
              const active = conversation.id === activeConversationId

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={[
                    'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition',
                    active
                      ? 'bg-zinc-800/80 text-zinc-100'
                      : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300',
                  ].join(' ')}
                >
                  <MessageSquare
                    size={15}
                    className={active ? 'text-zinc-300' : 'text-zinc-700'}
                  />

                  <span className="min-w-0 flex-1 truncate">
                    {conversation.title || 'Untitled chat'}
                  </span>
                </button>
              )
            })}

            {conversations.length === 0 && (
              <div className="px-3 py-8 text-center">
                <MessageSquare
                  size={20}
                  className="mx-auto mb-2 text-zinc-700"
                />
                <p className="text-xs text-zinc-600">
                  No conversations yet
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-800/70 p-3">
          <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">
                ORBIT
              </span>

              <span className="text-[10px] text-zinc-700">
                v1.0.0
              </span>
            </div>

            <p className="mt-2 text-xs text-zinc-400">
              Built by Tayub
            </p>

            <p className="mt-1 text-[10px] text-zinc-700">
              Think · Plan · Build · Evolve
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
              {initials || 'U'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {user.name}
              </p>

              <p className="truncate text-[11px] text-zinc-600">
                {user.email}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar