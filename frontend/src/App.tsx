import { useEffect, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import ChatArea from './components/ChatArea'
import Sidebar from './components/Sidebar'
import AdminUsage from './components/AdminUsage'
import {
  createConversation,
  deleteConversation,
  getConversations,
  getMessages,
  getMe,
  renameConversation,
  sendMessage,
  toggleConversationPin,
  type Conversation,
  type Message,
  type User,
} from './lib/api'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [adminUsageOpen, setAdminUsageOpen] =
    useState(false)
  const [conversations, setConversations] = useState<
    Conversation[]
  >([])
  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false)

  const [deleteTarget, setDeleteTarget] =
    useState<Conversation | null>(null)

  const [deleting, setDeleting] = useState(false)

  async function loadApp() {
    try {
      const currentUser = await getMe()
      setUser(currentUser)

      const chats = await getConversations()
      setConversations(chats)

      if (chats.length > 0) {
        setActiveConversationId(chats[0].id)
        await loadMessages(chats[0].id)
      } else {
        setActiveConversationId(null)
        setMessages([])
      }
    } catch {
      localStorage.removeItem('access_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(conversationId: string) {

    try {
      const result = await getMessages(conversationId)
      setMessages(result)
    } catch (error) {
      console.error(error)
      setMessages([])
    } //finally {
    //   setMessagesLoading(false)
    // }
  }

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      loadApp()
    } else {
      setLoading(false)
    }
  }, [])

  async function handleAuthenticated() {
    setLoading(true)
    await loadApp()
  }

  function handleNewChat() {
    setActiveConversationId(null)
    setMessages([])
    setMobileSidebarOpen(false)
  }

  async function handleSelectConversation(id: string) {
    setActiveConversationId(id)
    await loadMessages(id)
  }

  async function handleSend(message: string) {
    if (sending) {
      return
    }

    setSendError(null)
    setSending(true)

    let conversationId = activeConversationId

    try {
      // If we're on the home screen, create a new conversation first.
      if (!conversationId) {
        const newConversation = await createConversation()

        conversationId = newConversation.id

        setActiveConversationId(conversationId)

        setConversations((current) => [
          newConversation,
          ...current,
        ])
      }

      const temporaryMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      }

      setMessages((current) => [
        ...current,
        temporaryMessage,
      ])

      await sendMessage(conversationId, message)

      const updatedMessages = await getMessages(
        conversationId,
      )

      setMessages(updatedMessages)

      const updatedConversations =
        await getConversations()

      setConversations(updatedConversations)
    } catch (error) {
      console.error(error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong while sending your message.'

      setMessages((current) =>
        current.filter(
          (item) =>
            !(
              item.id.startsWith('temp-') &&
              item.content === message
            ),
        ),
      )

      if (
        errorMessage.toLowerCase().includes('10000') ||
        errorMessage.toLowerCase().includes('too long') ||
        errorMessage.toLowerCase().includes('max_length')
      ) {
        setSendError(
          'Message is too long. Please keep your message under 10,000 characters.',
        )
      } else {
        setSendError(errorMessage)
      }
    } finally {
      setSending(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('access_token')
    setUser(null)
    setConversations([])
    setMessages([])
    setActiveConversationId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-sm text-zinc-600">
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={handleAuthenticated}
      />
    )
  }

  if (adminUsageOpen) {
    return (
      <div className="flex h-[100dvh] overflow-hidden bg-[#0b0b0b] text-white">
        <AdminUsage
          onBack={() => setAdminUsageOpen(false)}
        />
      </div>
    )
  }

  async function handleTogglePin(conversationId: string) {
    try {
      const updatedConversation =
        await toggleConversationPin(conversationId)

      setConversations((current) =>
        current
          .map((conversation) =>
            conversation.id === updatedConversation.id
              ? updatedConversation
              : conversation,
          )
          .sort((a, b) => {
            if (a.pinned !== b.pinned) {
              return a.pinned ? -1 : 1
            }

            return (
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
            )
          }),
      )
    } catch (error) {
      console.error('Failed to toggle conversation pin:', error)
    }
  }


  async function handleRename(
    conversationId: string,
    title: string,
  ) {
    try {
      const updatedConversation =
        await renameConversation(
          conversationId,
          title,
        )

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === updatedConversation.id
            ? updatedConversation
            : conversation,
        ),
      )
    } catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }


  function handleDelete(conversationId: string) {
    const conversation = conversations.find(
      (item) => item.id === conversationId,
    )

    if (!conversation) {
      return
    }

    setDeleteTarget(conversation)
  }


  async function handleConfirmDelete() {
    if (!deleteTarget || deleting) {
      return
    }

    setDeleting(true)

    try {
      await deleteConversation(deleteTarget.id)

      const remaining = conversations.filter(
        (item) => item.id !== deleteTarget.id,
      )

      setConversations(remaining)
      setDeleteTarget(null)

      if (activeConversationId === deleteTarget.id) {
        setMessages([])

        if (remaining.length > 0) {
          await handleSelectConversation(
            remaining[0].id,
          )
        } else {
          setActiveConversationId(null)
        }
      }
    } catch (error) {
      console.error(
        'Failed to delete conversation:',
        error,
      )
    } finally {
      setDeleting(false)
    }
  }


  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-[#0b0b0b] text-white">
      <Sidebar
        user={user}
        conversations={conversations}
        activeConversationId={activeConversationId}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() =>
          setMobileSidebarOpen(false)
        }
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onLogout={handleLogout}
        isAdmin={user.is_admin}
        onOpenUsage={() => setAdminUsageOpen(true)}
        onTogglePin={handleTogglePin}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      <ChatArea
        messages={messages}
        loading={loading}
        sending={sending}
        error={sendError}
        onSend={handleSend}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111113] p-5 shadow-2xl"
          >
            <div className="mb-5">
              <h2
                id="delete-dialog-title"
                className="text-base font-semibold text-zinc-100"
              >
                Delete Chat?
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Are you sure you want to permanently delete
                {' '}
                <span className="font-medium text-zinc-300">
                  "{deleteTarget.title || 'Untitled chat'}"
                </span>
                ? This will also delete all messages in this
                Chat.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App