import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Trash2,
  X,
  LogOut,
  MessageSquare,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
  isAdmin: boolean
  onOpenUsage: () => void
  onTogglePin: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
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
  isAdmin,
  onOpenUsage,
  onTogglePin,
  onRename,
  onDelete,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    return (
      localStorage.getItem('orbit_sidebar_collapsed') ===
      'true'
    )
  })

  const [openMenuId, setOpenMenuId] = useState<string | null>(
    null,
  )

  const [renamingId, setRenamingId] = useState<string | null>(
    null,
  )

  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    localStorage.setItem(
      'orbit_sidebar_collapsed',
      String(collapsed),
    )
  }, [collapsed])

  useEffect(() => {
    function handleDocumentClick() {
      setOpenMenuId(null)
    }

    document.addEventListener(
      'click',
      handleDocumentClick,
    )

    return () => {
      document.removeEventListener(
        'click',
        handleDocumentClick,
      )
    }
  }, [])

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  function startRename(conversation: Conversation) {
    setOpenMenuId(null)
    setRenamingId(conversation.id)
    setRenameValue(
      conversation.title || 'Untitled chat',
    )
  }

  function cancelRename() {
    setRenamingId(null)
    setRenameValue('')
  }

  function submitRename(conversationId: string) {
    const title = renameValue.trim()

    if (!title) {
      return
    }

    onRename(conversationId, title)
    cancelRename()
  }

  function handleDelete(conversationId: string) {
    setOpenMenuId(null)
    onDelete(conversationId)
  }

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
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-800/70 bg-[#0d0d0f] transition-[width,transform] duration-200 lg:static lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[280px]',
          mobileOpen
            ? 'w-[280px] translate-x-0'
            : 'w-[280px] -translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div
          className={[
            'flex h-16 items-center border-b border-transparent',
            collapsed
              ? 'justify-center px-2'
              : 'justify-between px-4',
          ].join(' ')}
        >
          <div
            className={[
              'flex items-center',
              collapsed
                ? 'justify-center'
                : 'gap-2.5',
            ].join(' ')}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <OrbitMark
                size={17}
                className="text-zinc-200"
              />
            </div>

            {!collapsed && (
              <div>
                <div className="text-sm font-semibold text-zinc-100">
                  Personal AI
                </div>

                <div className="text-[10px] text-zinc-600">
                  Assistant
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300 lg:flex"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={onMobileClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 lg:hidden"
                aria-label="Close sidebar"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="absolute right-[-16px] top-5 z-50 hidden h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-[#111111] text-zinc-500 shadow-lg transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 lg:flex"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* New Chat */}
        <div
          className={[
            'pb-3',
            collapsed ? 'px-2' : 'px-3',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => {
              setOpenMenuId(null)
              onNewChat()
            }}
            className={[
              'flex h-10 w-full items-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800',
              collapsed
                ? 'justify-center px-0'
                : 'gap-2.5 px-3',
            ].join(' ')}
            aria-label="New chat"
            title={collapsed ? 'New chat' : undefined}
          >
            <Plus size={17} />

            {!collapsed && 'New chat'}
          </button>
        </div>

        {/* Conversations */}
        <div
          className={[
            'flex-1 overflow-y-auto',
            'px-2',
          ].join(' ')}
        >
          {!collapsed && (
            <div className="px-2 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
              Conversations
            </div>
          )}

          <div className="space-y-0.5">
            {conversations.map((conversation) => {
              const active =
                conversation.id === activeConversationId

              const isRenaming =
                renamingId === conversation.id

              const menuOpen =
                openMenuId === conversation.id

              return (
                <div
                  key={conversation.id}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isRenaming) {
                        return
                      }

                      setOpenMenuId(null)
                      onSelectConversation(
                        conversation.id,
                      )
                    }}
                    className={[
                      'group flex w-full items-center rounded-lg text-left text-sm transition',
                      collapsed
                        ? 'justify-center px-0 py-2.5'
                        : 'gap-2.5 px-3 py-2.5',
                      active
                        ? 'bg-zinc-800/80 text-zinc-100'
                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300',
                    ].join(' ')}
                    title={
                      collapsed
                        ? conversation.title ||
                          'Untitled chat'
                        : undefined
                    }
                  >
                    <MessageSquare
                      size={15}
                      className={
                        active
                          ? 'text-zinc-300'
                          : 'text-zinc-700'
                      }
                    />

                    {!collapsed && (
                      <>
                        {isRenaming ? (
                          <div
                            className="flex min-w-0 flex-1 items-center gap-1.5"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(event) =>
                                setRenameValue(
                                  event.target.value,
                                )
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key ===
                                  'Enter'
                                ) {
                                  event.preventDefault()
                                  submitRename(
                                    conversation.id,
                                  )
                                }

                                if (
                                  event.key ===
                                  'Escape'
                                ) {
                                  event.preventDefault()
                                  cancelRename()
                                }
                              }}
                              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                              maxLength={100}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                submitRename(
                                  conversation.id,
                                )
                              }
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
                              aria-label="Save rename"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={cancelRename}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
                              aria-label="Cancel rename"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="min-w-0 flex-1 truncate">
                              {conversation.title ||
                                'Untitled chat'}
                            </span>

                            {conversation.pinned && (
                              <Pin
                                size={12}
                                className="shrink-0 text-zinc-400"
                                fill="currentColor"
                              />
                            )}

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()

                                setOpenMenuId(
                                  menuOpen
                                    ? null
                                    : conversation.id,
                                )
                              }}
                              className={[
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition',
                                'hover:bg-zinc-800 hover:text-zinc-300',
                                menuOpen
                                  ? 'bg-zinc-800 text-zinc-300'
                                  : 'text-zinc-500',
                              ].join(' ')}
                              aria-label="Conversation options"
                              title="Conversation options"
                            >
                              <MoreHorizontal
                                size={16}
                              />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </button>

                  {/* Conversation menu */}
                  {!collapsed &&
                    menuOpen &&
                    !isRenaming && (
                      <div
                        className="absolute right-2 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-800 bg-[#151517] p-1 shadow-2xl"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onTogglePin(
                              conversation.id,
                            )
                          }
                          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                        >
                          <Pin
                            size={14}
                            className="shrink-0"
                          />
                          {conversation.pinned
                            ? 'Unpin'
                            : 'Pin'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            startRename(
                              conversation,
                            )
                          }
                          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                        >
                          <Pencil
                            size={14}
                            className="shrink-0"
                          />
                          Rename
                        </button>

                        <div className="my-1 border-t border-zinc-800" />

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              conversation.id,
                            )
                          }
                          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
                        >
                          <Trash2
                            size={14}
                            className="shrink-0"
                          />
                          Delete chat
                        </button>
                      </div>
                    )}
                </div>
              )
            })}

            {conversations.length === 0 &&
              !collapsed && (
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

        {/* User section */}
        <div
          className={[
            'border-t border-zinc-800/70',
            collapsed ? 'px-2 py-3' : 'p-3',
          ].join(' ')}
        >
          {!collapsed && isAdmin && (
            <button
              type="button"
              onClick={() => {
                setOpenMenuId(null)
                onOpenUsage()
              }}
              className="mb-2 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
            >
              <BarChart3 size={15} />
              Admin usage
            </button>
          )}

          {!collapsed && (
            <div className="mb-3 px-1">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                      Built by
                    </p>

                    <p className="mt-1 text-[15px] font-semibold tracking-tight text-zinc-100">
                      Tayub
                    </p>

                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      Personal AI · ORBIT
                    </p>
                  </div>

                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-[11px] font-semibold text-zinc-400">
                    T
                  </span>
                </div>

                <a
                  href="https://github.com/ttayubudeen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/70 px-2.5 py-2 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
                  aria-label="Tayyub's GitHub profile"
                  title="GitHub"
                >
                  <span className="font-medium">
                    GitHub
                  </span>

                  <span className="text-zinc-600 transition group-hover:text-zinc-400">
                    ↗
                  </span>
                </a>
              </div>
            </div>
          )}

          <div
            className={[
              'flex items-center rounded-xl',
              collapsed
                ? 'justify-center'
                : 'gap-3 border-t border-zinc-800/70 px-2 pt-3',
            ].join(' ')}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300"
              title={collapsed ? user.name : undefined}
            >
              {initials || 'U'}
            </div>

            {!collapsed && (
              <>
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
              </>
            )}
          </div>

        </div>
      </aside>
    </>
  )
}

export default Sidebar