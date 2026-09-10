import { ArrowUp } from 'lucide-react'
import { useState } from 'react'

interface ComposerProps {
  disabled: boolean
  onSend: (message: string) => void
}

function Composer({
  disabled,
  onSend,
}: ComposerProps) {
  const [message, setMessage] = useState('')

  function submit() {
    const trimmed = message.trim()

    if (!trimmed || disabled) {
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
      submit()
    }
  }

  return (
    <div className="shrink-0 border-t border-zinc-800 bg-[#0b0b0b] px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-zinc-800 bg-[#111111] p-2 shadow-2xl">
        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Message your assistant..."
          className="max-h-48 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
        />

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !message.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Send message"
        >
          <ArrowUp size={18} />
        </button>
      </div>

      <p className="mt-2 hidden text-center text-[11px] text-zinc-700 sm:block">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  )
}

export default Composer