import {
  Check,
  Copy,
} from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../lib/api'
import OrbitMark from './OrbitMark'

interface ChatMessageProps {
  message: Message
}

function CodeBlock({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const language = className
    ?.replace('language-', '')
    .trim()

  const code = String(children).replace(/\n$/, '')

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      // Clipboard may be unavailable in some browser contexts.
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-zinc-800 bg-[#0d0d0d] sm:my-4">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-[#111111] px-3 py-2">
        <span className="text-[11px] text-zinc-600">
          {language || 'code'}
        </span>

        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? (
            <Check size={13} />
          ) : (
            <Copy size={13} />
          )}

          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre className="overflow-x-auto p-3 text-[12px] leading-5 text-zinc-300 sm:p-4 sm:text-[13px] sm:leading-6">
        <code>{children}</code>
      </pre>
    </div>
  )
}

function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(
        message.content,
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      // Clipboard may be unavailable in some browser contexts.
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-3 sm:px-6">
        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-zinc-800 px-4 py-3 text-[15px] leading-7 text-zinc-100 sm:max-w-[75%]">
          <p className="whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="group px-3 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto flex max-w-3xl gap-3 sm:gap-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 sm:h-8 sm:w-8">
          <OrbitMark
            size={16}
            className="text-zinc-300"
          />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="mb-1 text-xs font-medium text-zinc-500">
            ORBIT
          </div>

          <div className="markdown-content text-[15px] text-zinc-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({
                  inline,
                  className,
                  children,
                }: {
                  inline?: boolean
                  className?: string
                  children?: React.ReactNode
                }) => {
                  if (inline) {
                    return (
                      <code className="rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[13px] text-zinc-300">
                        {children}
                      </code>
                    )
                  }

                  return (
                    <CodeBlock
                      className={className}
                    >
                      {children}
                    </CodeBlock>
                  )
                },

                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="min-w-full text-left text-sm">
                      {children}
                    </table>
                  </div>
                ),

                th: ({ children }) => (
                  <th className="border-b border-zinc-800 bg-zinc-900 px-3 py-2 font-medium text-zinc-200">
                    {children}
                  </th>
                ),

                td: ({ children }) => (
                  <td className="border-b border-zinc-800/70 px-3 py-2 text-zinc-400">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          <button
            type="button"
            onClick={copyMessage}
            className="mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300 sm:opacity-0 sm:group-hover:opacity-100"
          >
            {copied ? (
              <Check size={13} />
            ) : (
              <Copy size={13} />
            )}

            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatMessage