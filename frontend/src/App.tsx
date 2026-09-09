import { useEffect, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import ChatArea from './components/ChatArea'
import Sidebar from './components/Sidebar'
import {
  createConversation,
  getConversations,
  getMe,
  getMessages,
  sendMessage,
} from './lib/api'
import type {
  Conversation,
  Message,
  User,
} from './lib/api'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<
    Conversation[]
  >([])
  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false)

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
    if (sending || !message.trim()) {
      return
    }

    setSending(true)

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

    try {
      let conversationId = activeConversationId

      if (!conversationId) {
        const conversation = await createConversation()

        conversationId = conversation.id

        setActiveConversationId(conversation.id)

        setConversations((current) => [
          conversation,
          ...current,
        ])
      }

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

      setMessages((current) =>
        current.filter(
          (item) => item.id !== temporaryMessage.id,
        ),
      )
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0b0b] text-white">
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
      />

      <ChatArea
        messages={messages}
        loading={loading}
        sending={sending}
        disabled={sending}
        hasConversation={Boolean(activeConversationId)}
        onSend={handleSend}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />
    </div>
  )
}

export default App