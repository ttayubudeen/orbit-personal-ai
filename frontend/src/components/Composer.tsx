import { ArrowUp } from 'lucide-react'
import { useState } from 'react'

interface ComposerProps {
  disabled: boolean
  onSend: (message: string) => void
  error?: string | null
}

const MAX_MESSAGE_LENGTH = 10000

function Composer({
  disabled,
  onSend,
  error,
}: ComposerProps) {
  const [message, setMessage] = useState('')

  const characterCount = message.length
  const showCounter = characterCount >= 9000
  const isTooLong = characterCount > MAX_MESSAGE_LENGTH

  function submit(value = message) {
    const trimmed = value.trim()

    if (!trimmed || disabled) {
      return
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return
    }

    onSend(trimmed)
    setMessage('')
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit(event.currentTarget.value)
    }
  }

  return (
    <div className="shrink-0 border-t border-zinc-800/80 bg-[#0b0b0b] px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4">
      <div className="mx-auto w-full max-w-3xl">
        {error && (
          <div className="mb-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-400">
            {error}
          </div>
        )}

        <div
          className={[
            'flex items-end gap-2 rounded-2xl border bg-[#111111] p-2 shadow-2xl transition',
            isTooLong
              ? 'border-zinc-600'
              : 'border-zinc-800 focus-within:border-zinc-700',
          ].join(' ')}
        >
          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder="Message your assistant..."
            className="max-h-48 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-zinc-600"
          />

          <button
            type="button"
            onClick={() => submit()}
            disabled={
              disabled ||
              !message.trim() ||
              isTooLong
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Send message"
          >
            <ArrowUp size={18} />
          </button>
        </div>

        <div className="mt-2 flex min-h-4 items-center justify-between px-1">
          <p className="hidden text-[11px] text-zinc-700 sm:block">
            Enter to send · Shift + Enter for a new line
          </p>

          {showCounter && (
            <p
              className={[
                'ml-auto text-[11px]',
                isTooLong
                  ? 'text-zinc-300'
                  : 'text-zinc-600',
              ].join(' ')}
            >
              {characterCount.toLocaleString()} / 10,000
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Composer