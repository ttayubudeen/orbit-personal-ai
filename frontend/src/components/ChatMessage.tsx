import { Bot, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../lib/api'

interface ChatMessageProps {
  message: Message
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message.content)
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
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-zinc-800 px-4 py-3 text-[15px] leading-7 text-zinc-100 sm:max-w-[75%]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="group px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-3xl gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
          <Bot size={16} className="text-zinc-300" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="mb-1 text-xs font-medium text-zinc-500">
            Assistant
          </div>

          <div className="markdown-content text-[15px] text-zinc-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
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
            className="mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-zinc-700 opacity-0 transition hover:bg-zinc-900 hover:text-zinc-400 group-hover:opacity-100"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatMessage