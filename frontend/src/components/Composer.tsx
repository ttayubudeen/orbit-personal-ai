import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'

interface ComposerProps {
  onSend: (message: string) => void
  disabled?: boolean
  hasConversation: boolean
}

function Composer({
  onSend,
  disabled = false,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
  }, [])

  function resizeTextarea() {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
  }

  function submit() {
    const value = textareaRef.current?.value.trim() ?? ''

    if (!value || disabled) return

    onSend(value)

    if (textareaRef.current) {
      textareaRef.current.value = ''
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6 sm:pb-6">
      <div
        className={[
          'rounded-2xl border bg-zinc-900/80 shadow-2xl shadow-black/10 backdrop-blur-xl transition',
          disabled
            ? 'border-zinc-800 opacity-70'
            : 'border-zinc-800 focus-within:border-zinc-700',
        ].join(' ')}
      >
        <div className="flex items-end gap-2 p-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            onInput={resizeTextarea}
            placeholder="Message Orbit..."
            
            className="max-h-[180px] min-h-[42px] flex-1 resize-none bg-transparent px-2.5 py-2.5 text-[15px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
          />

          <button
            type="button"
            onClick={submit}
            disabled={disabled}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
            aria-label="Send message"
          >
            <ArrowUp size={17} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center justify-between px-4 pb-2.5">
          <span className="text-[10px] text-zinc-700">
            Enter to send · Shift + Enter for newline
          </span>

          <span className="text-[10px] text-zinc-700">
            AI assistant
          </span>
        </div>
      </div>
    </div>
  )
}

export default Composer