import {
  Brain,
  CalendarDays,
  Lightbulb,
  Menu,
  Sparkles,
} from 'lucide-react'

import { useEffect, useRef, useState } from 'react'
import type { Message } from '../lib/api'
import ChatMessage from './ChatMessage'
import Composer from './Composer'
import OrbitMark from './OrbitMark'

interface ChatAreaProps {
  messages: Message[]
  loading: boolean
  sending: boolean
  onSend: (message: string) => void
  onOpenSidebar: () => void
}

const starterPrompts = [
  {
    label: 'Help me plan my day',
    icon: CalendarDays,
  },
  {
    label: 'Explain something I’m learning',
    icon: Brain,
  },
  {
    label: 'Help me think through a problem',
    icon: Lightbulb,
  },
  {
    label: 'What can you help me with?',
    icon: Sparkles,
  },
]

function ChatArea({
  messages,
  loading,
  sending,
  onSend,
  onOpenSidebar,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messagesContainerRef =
    useRef<HTMLDivElement>(null)

  const latestUserMessageRef =
    useRef<HTMLDivElement>(null)

  const previousMessageCountRef =
    useRef(messages.length)

  const isFollowingResponseRef = useRef(false)

  const userInterruptedRef = useRef(false)

  const [showJumpToLatest, setShowJumpToLatest] =
    useState(false)


  useEffect(() => {
    const previousCount =
      previousMessageCountRef.current

    const currentCount = messages.length

    if (currentCount > previousCount) {
      const newestMessage =
        messages[messages.length - 1]

      if (newestMessage?.role === 'user') {
        userInterruptedRef.current = false
        isFollowingResponseRef.current = true

        requestAnimationFrame(() => {
          scrollToLatestUserMessage()
        })
      }
    }

    if (
      sending &&
      isFollowingResponseRef.current &&
      !userInterruptedRef.current
    ) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      })
    }

    previousMessageCountRef.current =
      currentCount
  }, [messages, sending])


  useEffect(() => {
    const container = messagesContainerRef.current

    if (!container) {
      return
    }

    function handleScroll() {
      const distanceFromBottom =
        container!.scrollHeight -
        container!.scrollTop -
        container!.clientHeight

      const atBottom = distanceFromBottom <= 120

      setShowJumpToLatest(!atBottom)
    }

    function handleUserInterrupt() {
      if (isFollowingResponseRef.current) {
        userInterruptedRef.current = true
        isFollowingResponseRef.current = false
      }
    }

    container.addEventListener(
      'scroll',
      handleScroll,
      { passive: true },
    )

    container.addEventListener(
      'wheel',
      handleUserInterrupt,
      { passive: true },
    )

    container.addEventListener(
      'touchmove',
      handleUserInterrupt,
      { passive: true },
    )

    handleScroll()

    return () => {
      container.removeEventListener(
        'scroll',
        handleScroll,
      )

      container.removeEventListener(
        'wheel',
        handleUserInterrupt,
      )

      container.removeEventListener(
        'touchmove',
        handleUserInterrupt,
      )
    }
  }, [])


  function scrollToLatestUserMessage() {
    const container = messagesContainerRef.current
    const message = latestUserMessageRef.current

    if (!container || !message) {
      return
    }

    const messageTop = message.offsetTop

    const targetScrollTop =
      messageTop -
      container.clientHeight * 0.2

    container.scrollTo({
      top: Math.max(targetScrollTop, 0),
      behavior: 'smooth',
    })
  }
  
  function jumpToLatest() {
    userInterruptedRef.current = false
    isFollowingResponseRef.current = true
    setShowJumpToLatest(false)

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }

  const latestUserMessageId =
    [...messages]
      .reverse()
      .find((message) => message.role === 'user')
      ?.id

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0b0b0b]">
      <header className="flex h-14 shrink-0 items-center border-b border-zinc-800 px-4 md:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="mr-3 rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white md:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={19} />
        </button>

        <div className="flex items-center gap-2.5">
          <OrbitMark
            size={25}
            className="text-zinc-300"
          />

          <div>
            <div className="text-sm font-medium tracking-tight">
              ORBIT
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ready
            </div>
          </div>
        </div>
      </header>

      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-full items-center justify-center px-4 py-10 sm:px-6">
            <div className="w-full max-w-2xl">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-[#111111] shadow-xl">
                  <OrbitMark
                    size={34}
                    className="text-zinc-300"
                  />
                </div>

                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  How can I help?
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-500">
                  Ask questions, work through ideas, plan your day,
                  or just talk. I’m ready when you are.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {starterPrompts.map(
                  ({ label, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={sending}
                      onClick={() => onSend(label)}
                      className="group flex min-h-14 items-center gap-3 rounded-xl border border-zinc-800 bg-[#101010] px-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-[#151515] hover:shadow-lg active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 transition-all duration-150 group-hover:border-zinc-700 group-hover:bg-zinc-800 group-hover:text-zinc-300 group-active:scale-95">
                        <Icon size={16} />
                      </span>

                      <span className="flex-1 text-sm text-zinc-300 transition group-hover:text-white">
                        {label}
                      </span>

                      <span className="text-zinc-700 transition-all duration-150 group-hover:translate-x-1 group-hover:text-zinc-400 group-active:translate-x-0.5">
                        →
                      </span>
                    </button>
                  ),
                )}
              </div>

              <p className="mt-6 text-center text-[11px] text-zinc-700">
                Or start typing below
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 md:px-6">
            {messages.map((message) => (
              <div
                key={message.id}
                ref={
                  message.id === latestUserMessageId
                    ? latestUserMessageRef
                    : undefined
                }
              >
                <ChatMessage message={message} />
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500" />
                Thinking...
              </div>
            )}

            <div ref={messagesEndRef} />

            {showJumpToLatest && (
              <button
                type="button"
                onClick={jumpToLatest}
                className="sticky bottom-4 mx-auto flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 shadow-xl transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
              >
                <span className="text-sm">↓</span>
                Jump to latest
              </button>
            )}
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